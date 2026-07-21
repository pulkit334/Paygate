# Security & Architecture Audit — PayGate Orchestrator

**Scope:** ApiGateway (6283), backend/merchant-auth (50002), backend1/payment-engine (50051), backend2/webhook-delivery (4000), Redis, docker-compose.

**Bottom line:** the code has decent instincts (AES-GCM, bcrypt, HMAC, Redis sessions, idempotency keys) but the **trust boundary is broken**. All authentication lives in the gateway, yet every backend is reachable directly with no auth and blindly trusts an `appId` field in the request. That single design flaw turns several "medium" issues into "game over." Plus live production secrets are committed to the repo.

---

## 1. Security Audit

### 1.1 Authentication & Authorization

**The core flaw: backends have zero authentication and trust `appId` from the caller.**
Every gRPC handler (`GetTransaction`, `GetLedger`, `GetProviderKeys`, `CreateApiKey`, `UpdateProviderKey`…) does `const { appId } = call.request` and queries on it directly (`app.payment.ts:91`, `TransactionRoutes` → backend1). The gateway is the *only* thing that maps a session/API-key to an `appId`. So:

- If ports 50002/50051 are reachable (they are host-mapped — see 1.7), anyone runs `grpcurl -d '{"appId":"<victim>"}' host:50051 ... GetTransction` and reads **any merchant's transactions, ledger, and provider metadata**. Complete multi-tenant breach. No credential needed.
- `MiddlewareAuth` and `ValidateApiKey` are gRPC methods with no transport auth — an attacker can call the auth service itself.

**JWT / session:**
- `MiddlewareAuth` (`app.controller.ts:193`) verifies the JWT but **does not pin the algorithm**. `jwt.verify` with a symmetric secret is okay against `alg:none` in modern `jsonwebtoken`, but you should still pass `{ algorithms: ["HS256"] }` explicitly.
- Session `secure`/`trust proxy` bug already fixed. Note `isProduction` is derived from `NODE_ENV`, which is **never set** in compose — so the production `SESSION_SECRET` guard (`session.ts:27`) never fires, and the dev fallback secret would be used silently if the env var were missing.
- **No login brute-force protection.** `generalLimiter` is `max: 10000 / 15min` (`server.ts:50`) — effectively unlimited for password guessing on `/auth/login`. `LoginSchema` also caps password at **16 chars** (`app.schema.ts:12`), weakening strong passwords for no reason.

### 1.2 Secrets Management — CRITICAL

- **`docker-compose.prod.yml` contains live secrets in plaintext**, committed to the repo:
  - MongoDB Atlas: `pulkittales12_db_user:BGvisZXQIpK1Penc`
  - Razorpay: `rzp_test_Rqeqwh3jxZUoO6` / `MQCPqJ2mZrw822aXYquwq4a1`
  - `JWT_SECRET=PK8UBB` (**6 characters — brute-forceable in seconds**; forge lany merchant's token)
  - `ENCRYPTION_KEY`, `SESSION_SECRET=XBSHHDHGHDHD`, `WEBHOOK_SIGNING_SECRET=Xmac`

  If this repo is anywhere non-local, treat all of these as compromised. `JWT_SECRET` and `WEBHOOK_SIGNING_SECRET` are also far too short to be secure even if private.
- **API keys and hashed secrets are logged in plaintext.** `ValidateApiKey` does `console.log("ValidateApiKey called with:", apiKey)` and logs the SHA-256 (`app.controller.ts:115,128`). Your `sk_live_...` secrets land in stdout → Docker logs → wherever those ship.

### 1.3 Payment-Specific Risks

- **Amount not re-validated on verify.** `VerifyPayment` (`app.PaymentService.ts:93`) checks the Razorpay signature but never confirms the paid amount matches `transaction.amount`. Combined with…
- **Webhook trusts the amount in its own payload.** `payWebhook` credits the ledger with `amountPaise` taken straight from the webhook body (`app.webhook.ts:46,81`) without comparing to the stored `txn.amount`. A valid-signature webhook (or anyone who reaches the gRPC method) can credit an arbitrary amount. **No currency check** either — order in USD, webhook says INR, ledger just adds the number.
- **Ledger accounting bug.** Balance is computed from the previous entry's `balanceBefore` instead of `balanceAfter` (`app.webhook.ts:80`). Running balance is wrong after the first entry.
- **Weak webhook secret.** `WEBHOOK_SIGNING_SECRET=Xmac` — trivially guessable; forge signed webhooks.
- Idempotency is present and reasonable (unique `idempotencyKey`, `status==="paid"` short-circuit inside a Mongo transaction) — good. But there is **no replay-timestamp check**; a captured valid webhook can be re-POSTed indefinitely (harmless only because of the status check).

### 1.4 SSRF — HIGH (two vectors)

- **Merchant-controlled callback URL, no validation.** `webhook_service.ts:80` does `axios.post(data.callbackUrl, …)` where `callbackUrl` comes from the merchant. Point it at `http://169.254.169.254/latest/meta-data/…` (AWS IMDS — you're on EC2) or `http://localhost:6379` and the server fetches internal resources. The server even signs the request with your secret.
- **Unauthenticated stream injection.** `backend2` exposes `POST /api/test-webhook` (`route.ts:10`) with **no auth**, letting anyone push a job with an arbitrary `callbackUrl` into `payment.stream`. The delivery worker then sends a **validly HMAC-signed** payload to that URL. Also `/flaky` and `/test-webhook` are **test endpoints shipped to prod**.

### 1.5 Injection

- **NoSQL operator injection.** `GetWebhookHistory` (`backend2/controller/webhook.ts:15,20`) uses `req.query.appId` directly in the Mongo filter. Express parses `?appId[$ne]=x` into an **object**, so `{ appId: { $ne: "x" } }` returns **every app's webhook history and payloads**. Same pattern is unsafe anywhere `req.query` flows into a query. Add strict validation + set `app.set('query parser', 'simple')`.
- Registration/login inputs go through Zod (email-validated) — those paths are safe.

### 1.6 Access Control / IDOR

- `backend2 /api/webhooks` has **no auth** and takes `appId` from the query. The gateway wraps it with `JwtAuthMiddleware`, but backend2 is directly reachable, so the gateway wrapper is bypassable → any app's webhook payloads/signatures readable.
- `PaymentRoutes.ts:78` `/transactions` (mounted at `/api/v2/payment`) has **no `JwtAuthMiddleware`**. It reads `req.merchant._id`, which is undefined without the middleware, so it throws "Unauthorized" rather than leaking — a latent bug, not a live breach, but fix the inconsistency (the real transactions route is the one in `TransactionRoutes.ts`, which is correctly guarded).

### 1.7 Network Exposure — CRITICAL

`docker-compose.prod.yml` maps to the host: `50002:50002`, `50051:50051`, `6379:6379`. gRPC uses `createInsecure()` and Redis has no password. If the EC2 security group allows these ports (or `0.0.0.0` binding + public IP), the entire auth-less backend and the session/rate-limit Redis are internet-exposed. **Remove these host port mappings** — inter-service traffic already works over the Docker network by service name.

### 1.8 Data Protection / Error Leakage

- Gateway 500 handler returns the raw error object to the client: `res.status(500).json({ …, message: err })` (`server.ts:89`). Leaks internals/stack context.
- gRPC internal messages are forwarded verbatim to clients via `AppError.Payment(err.message)` throughout the routes — e.g. "Transaction not found for orderId: …" and Mongo errors reach the API consumer.
- Good news: no card data is handled (Razorpay-hosted checkout), so PCI card-scope is limited; provider secrets are AES-256-GCM encrypted at rest (`encryption.ts`) with a random IV — that part is done correctly.

### 1.9 Dependencies

Couldn't run `npm audit` in this pass. Given `express`, `jsonwebtoken`, `mongoose`, `axios`, `ioredis` are all present, run `npm audit --production` in each of the four services and pin versions. The `ioredis` default-import broke the build earlier — that class of issue suggests loose version discipline.

---

## 2. Architecture & Design

- **Gateway abstraction:** `GatewayFactory` + `RazerPayService` is a reasonable start, but the abstraction is leaky — response fields are named `razorpayOrderId`, `razorkey`, `razorpay_signature` throughout the transaction model and API. Swapping in Stripe today would require schema and API changes. The `enum: ["razorpay","stripe"]` exists but only Razorpay is implemented.
- **Single points of failure:** Redis is central (sessions, rate-limit, payment stream, account-summary stream) with **no password and no HA**. If Redis dies, auth, rate limiting, and webhook delivery all stop.
- **Retries:** webhook delivery has exponential backoff with jitter (good), 3 attempts. But provider (Razorpay) API calls in `initiatePayment` have **no timeout or retry** — a slow Razorpay call hangs the request.
- **Multi-tenancy:** as covered — isolation depends entirely on the gateway; the backends do not enforce it. This is the single most important architectural fix.

---

## 3. Code Quality

- Debug `console.log` everywhere in hot auth paths, including a profanity/placeholder error string in `ValidateApiKey` (`app.controller.ts:152`) that would be returned to clients.
- Duplicate transaction-fetch logic in `PaymentRoutes` and `TransactionRoutes`.
- Commented-out Redis cache block left in `LoginController`.
- Dockerfiles use `RUN npm run build 2>/dev/null || true` — **silently ships stale/broken builds** (this caused the six ghost deploys).
- **No tests** for the payment edge cases that matter (partial refunds — not implemented at all; failed-webhook retry; timeout; amount/currency mismatch).
- Typos baked into the API contract: `customoreEmail`, `GetTransction`, `Modals/` — hard to change later.

---

## 4. Prioritized Findings

| # | Issue | Severity | File / Location | Fix |
|---|-------|----------|-----------------|-----|
| 1 | Live secrets committed; `JWT_SECRET` 6 chars | **Critical** | `docker-compose.prod.yml` | Rotate ALL; move to gitignored `.env`/secrets manager; 32-byte random secrets |
| 2 | Backends unauthenticated + trust `appId`; ports exposed | **Critical** | compose port maps; all backend handlers | Remove `50002/50051/6379` host maps; add gRPC mTLS or shared-secret metadata; never trust `appId` from an untrusted caller |
| 3 | Redis no password, host-exposed | **Critical** | `docker-compose.prod.yml:5` | `requirepass`, drop `6379:6379` mapping |
| 4 | API keys/secrets logged in plaintext | **High** | `app.controller.ts:115,128` | Delete those `console.log`s |
| 5 | SSRF via merchant `callbackUrl` | **High** | `webhook_service.ts:80` | Block private/link-local IPs, require https, allowlist, disable redirects, set timeout |
| 6 | Unauth `/test-webhook` → signed SSRF; test routes in prod | **High** | `backend2/Routes/route.ts:10,31` | Remove test/flaky routes from prod build |
| 7 | NoSQL operator injection via query | **High** | `backend2/controller/webhook.ts:15` | `app.set('query parser','simple')` + Zod-validate `appId` as ObjectId |
| 8 | Webhook/verify don't re-check amount & currency | **High** | `app.webhook.ts:46,81`; `app.PaymentService.ts:106` | Compare payload amount+currency to `txn.amount`/`txn.currency`; reject mismatch |
| 9 | Webhook history IDOR (no auth on backend2) | **High** | `backend2/route.ts:8` | Enforce auth at backend2, derive `appId` from verified token, not query |
| 10 | Login brute-force; password capped at 16 | **High** | `server.ts:50`; `app.schema.ts:12` | Dedicated strict login limiter (e.g. 5/min/IP); remove max-length cap |
| 11 | Raw error object returned to client | **Medium** | `server.ts:89` | Return generic message; log detail server-side only |
| 12 | Ledger running-balance bug | **Medium** | `app.webhook.ts:80` | Use previous entry's `balanceAfter` |
| 13 | JWT algorithm not pinned | **Medium** | `app.controller.ts:193` | `jwt.verify(token, secret, { algorithms:["HS256"] })` |
| 14 | `NODE_ENV` unset → prod guards inert | **Medium** | compose | Set `NODE_ENV=production` |
| 15 | `\|\| true` hides build failures | **Medium** | all `Dockerfile`s | Remove; let build fail loud |
| 16 | Leaky gateway abstraction, no Stripe | **Low** | engine/model naming | Normalize to provider-neutral fields before Stripe work |

---

## 5. Top 5 to Fix This Week

1. **Rotate every secret in `docker-compose.prod.yml`** (Mongo password, Razorpay keys, JWT/encryption/session/webhook secrets — all 32+ bytes random) and move them out of git into an untracked `.env`. The current `JWT_SECRET` lets anyone forge a merchant token.
2. **Close the backend network exposure.** Delete the `50002/50051/6379` host port mappings from compose and set a Redis password. This alone removes the direct-to-backend multi-tenant breach.
3. **Stop trusting `appId` blindly + add gRPC auth.** Even after (2), add a shared-secret (or mTLS) check on gRPC calls so a foothold on the network can't impersonate the gateway.
4. **Fix the webhook path:** remove `/test-webhook` and `/flaky` from prod, add SSRF protection (block private IPs + timeout + no redirects) on `callbackUrl`, and validate amount+currency against the stored transaction before crediting the ledger.
5. **Kill secret logging and NoSQL injection:** delete the API-key `console.log`s, set `query parser` to `simple`, and validate `appId` query params as ObjectIds.
