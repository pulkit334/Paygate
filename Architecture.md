-PayGate — Architecture

Payment gateway platform that lets merchants accept payments through multiple
providers (Razorpay, Cashfree) behind a single API, with resilience patterns
guarding every network hop.

---

 1. System Overview

```
                                   ┌──────────────────────┐
                                   │      Frontend        │
                                   │  React (nginx :5173) │
                                   └──────────┬───────────┘
                                              │ HTTPS / session cookie
                                              ▼
        Razorpay ◄──────┐          ┌──────────────────────┐
        Cashfree ◄──┐   │ webhooks │     API Gateway      │
                    │   └─────────►│   Express  :6283     │
                    │              │                      │
                    │              │  rate limit · session │
                    │              │  API-key / JWT auth  │
                    │              │  resilience wrapper  │
                    │              └───┬──────────────┬───┘
                    │           gRPC   │              │  gRPC
                    │        :50002    ▼              ▼  :50051
                    │      ┌───────────────┐   ┌───────────────┐
                    │      │   Merchant    │   │   Payment     │
                    │      │   Service     │   │   Service     │
                    │      │  (backend)    │   │  (backend1)   │
                    │      │               │   │               │
                    │      │ auth · API    │   │ orders·verify │
                    │      │ keys·settings │   │ ledger·engine ├──► Razorpay /
                    │      └───────┬───────┘   └───────┬───────┘    Cashfree APIs
                    │              │                   │
                    │              ▼                   ▼
                    │      ┌─────────────────────────────────┐
                    │      │        MongoDB Atlas            │
                    │      └─────────────────────────────────┘
                    │                          │
                    │                          │ XADD payment.stream
                    │                          ▼
                    │              ┌──────────────────────┐
                    │              │    Redis (streams,   │
                    │              │  sessions, limits)   │
                    │              └──────────┬───────────┘
                    │                         │ XREADGROUP webhook-group
                    │                         ▼
                    │              ┌──────────────────────┐
                    └──────────────┤  Webhook Dispatcher  │
                     signed POST   │     (backend2 :4000) │
                     to merchant   └──────────────────────┘
```

All services run as Docker containers on a single EC2 host, orchestrated by
docker-compose. Images are published to Docker Hub and pulled on deploy.

---

2. Components

| Component | Tech | Port | Responsibility |
|---|---|---|---|
| Frontend | React + nginx | 5173 | Merchant dashboard: login, API keys, transactions, analytics |
| API Gateway | Express + TS | 6283 | Single public entry point. Session/JWT/API-key auth, rate limiting, request validation, fans out to internal services over gRPC |
| Merchant Service (backend) | Node + gRPC | 50002 | Merchant registration, login, API-key lifecycle, settings |
| Payment Service (backend1) | Node + gRPC | 50051 | Order creation, verification, ledger, provider adapters (Razorpay/Cashfree), webhook signature validation |
| Webhook Dispatcher (backend2) | Node worker | 4000 | Consumes `payment.stream` from Redis Streams (consumer group), delivers signed webhooks to merchant callback URLs with retry |
| @paygate/resilience | TS library (npm workspace) | — | Shared resilience policies: timeout, bulkhead, circuit breaker, retry — built on cockatiel |
| Redis | redis:alpine | 6379 | Session store, rate-limit counters, webhook event stream |
| MongoDB Atlas | managed | — | Merchants, transactions, ledger, webhook deliveries |

---

3. Resilience Layer (the interesting part)

Every gRPC call from the gateway passes through a shared policy pipeline
instead of being called raw:

```
 route handler
      │
      ▼
 callWithPolicy(client, method, payload)          ApiGateway/GrpcRef/paymentGrpcclient.ts
      │
      ▼
 ┌─────────────────────── grpcPolicy ────────────────────────┐
 │                                                           │
 │   Bulkhead                    Timeout                     │
 │   max 100 in-flight     ─►    3000 ms, aggressive         │─►  gRPC stub
 │   max 50 queued               (kills hung calls)          │
 │                                                           │
 └───────────────────────────────────────────────────────────┘
      │
      ├── success ──► response to client
      │
      ├── BulkheadRejectedError ──► fast 503 (system saturated, fail fast)
      │
      └── timeout (3 s) ──► 504-style error (slot freed, no zombie calls)
```

Provider-facing policies (Payment Service → Razorpay/Cashfree) additionally
use circuit breakers with sampling:

| Policy | Threshold | Window | Half-open after |
|---|---|---|---|
| Razorpay breaker | 50 % failures | 10 s | 50 s |
| Cashfree breaker | 70 % failures | 10 s | 30 s |

Design decisions:
- **Bulkhead before timeout** — queue wait does not consume the 3 s budget;
  the timeout measures actual work.
- **Aggressive timeout strategy** — a hung provider call is rejected and its
  bulkhead slot released; a slow dependency cannot exhaust gateway capacity.
- **Fail fast over queue up** — request #151 gets an instant rejection rather
  than a growing latency tail.
- **Auth path isolation (planned)** — merchant/auth calls will move to a
  dedicated policy so payment saturation can never starve logins.

---

## 4. Key Flows

### 4.1 Create Order
```
Merchant server ──POST /api/v2/payment/create (x-api-key)──► Gateway
Gateway ── validate key (Merchant Service, gRPC) ──► ok
Gateway ── callWithPolicy(CreateOrder) ──► Payment Service
Payment Service ── idempotency check ── provider adapter ──► Razorpay/Cashfree
Provider ◄── order created ──► response bubbles back ──► merchant
```
Idempotency: every order carries an `idempotencyKey` (client-supplied or
generated UUID) so a timed-out request can be retried safely — a timeout is
ambiguous, the upstream may have succeeded.

### 4.2 Payment Webhook (async settlement)
```
Provider ──POST /webhook/razorpay──► Gateway (raw body preserved)
Gateway ── callWithPolicy(WebhookBody) ──► Payment Service
Payment Service ── verify HMAC signature ── update transaction ── XADD payment.stream
Webhook Dispatcher ── XREADGROUP ── sign payload ── POST merchant callbackUrl
   └── on failure: retry with backoff, delivery status persisted
```
Redis Streams + consumer group gives at-least-once delivery and lets the
dispatcher crash/restart without losing events (pending entries are re-claimed).

### 4.3 Merchant Login
```
Browser ──POST /api/v1/auth/login──► Gateway
Gateway ── Login (Merchant Service, gRPC, deadline) ──► JWT issued
Gateway stores JWT server-side in Redis-backed session; browser only holds
an HttpOnly session cookie. Up to 3 concurrent app sessions per browser.
```

---

## 5. Failure Modes & Behavior

| Failure | System behavior |
|---|---|
| Payment Service down/hung | Calls rejected in ≤ 3 s; gateway, login, dashboard stay up |
| Provider (Razorpay) degraded | Circuit opens at threshold; calls fail instantly until half-open probe succeeds |
| Traffic spike > 150 concurrent payments | Bulkhead sheds excess with instant rejection; no memory growth, no latency collapse |
| Webhook consumer crash | Events remain in Redis Stream; consumer group redelivers on restart |
| Redis down | Sessions and rate limiting degrade; core order flow unaffected until session lookup needed |

---

## 6. Deployment

```
Developer ── docker build (monorepo root context) ──► Docker Hub (versioned tags)
EC2 host  ── docker compose pull && up -d ──► live
```
- The gateway image builds `@paygate/resilience` from source inside the image
  (multi-stage build; workspace-aware `npm ci`), so the shared library needs
  no separate registry.
- Secrets live only in the compose file on the host — compose is git-ignored.
```
