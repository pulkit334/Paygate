# PayGate — Microservices Payment Platform

## Architecture (4 Services)

```
Client → API Gateway (Express, port 6283)
            ├── Backend 1 (Merchant Service, gRPC port 50001)
            ├── Backend 2 (Payment Service, gRPC port 50051)
            └── Webhooks (Razorpay)
                    ↓
              gRPC Layer (binary, 7x faster than REST)
                    ↓
              Redis Cache + MongoDB
```

## Directory Structure

| Folder | Role | Key Files |
|--------|------|-----------|
| `ApiGateway/` | Entry point — auth, rate limit, routing | `server.ts`, `Middleware/jwtAuth.ts`, `Middleware/validate_APi_Key.ts`, `Routes/MerhcantRoutes.ts`, `Routes/PaymentRoutes.ts`, `utils/Error.ts`, `GrpcRef/Grpc.ts` |
| `backend/` | Merchant/Auth gRPC service | `server.ts` (gRPC), `controller/app.controller.ts`, `proto/merchant.proto` |
| `backend1/` | Payment processing service | `server.ts` (gRPC), `Engine/` (Factory+Proxy+Template patterns), `controller/app.payment.ts`, `controller/app.webhook.ts`, `models/transction.ts`, `models/ledgerentry.ts`, `services/app.PaymentService.ts`, `schema/` (Zod), `config/` (redis, razorpay, db) |
| `backend2/` | Secondary processing (WIP) | `server.ts`, `services/` |
| `Grpc/` | gRPC examples | `proto/random.proto` (4 patterns: unary, server-stream, client-stream, bidirectional) |

## Key Code Patterns (Interview Gold)

1. **Gateway Factory + Strategy** (`backend1/Engine/PaymentEngine.ts:8-46`) — Singleton factory that returns RazorpayProvider wrapped in a Proxy. Add Stripe = add 1 class + 1 case.

2. **Template Method** (`backend1/Engine/BaseTemplate.ts:3-14`) — `validate() → initiate() → confirm()` order enforced. All providers must follow this skeleton.

3. **Proxy with Retry + Exponential Backoff** (`backend1/Engine/Proxy/PaymentGatewayProxy.ts:4-43`) — Wraps real gateway, retries 5x with `delay × 2^attempt + random jitter`.

4. **Idempotency (DB-first write)** (`backend1/services/app.PaymentService.ts:22-39`) — Creates transaction with unique `idempotencyKey`. On 11000 duplicate error, returns existing record. Prevents double charges.

5. **Atomic Ledger via MongoDB Transactions** (`backend1/controller/app.webhook.ts:51-118`) — `withTransaction` session reads `balanceBefore`, writes `balanceAfter`, updates status — all atomic.

6. **Redis Streams** (`backend1/controller/app.webhook.ts:103-136`) — Publishes `AccountSummaryUpdate` and `payment.stream` events via Redis streams (not pub/sub).

7. **Two-tier Rate Limiting** (`ApiGateway/server.ts:31-51`) — 100 req/15min general + 10 req/60sec payments, backed by Redis, not in-memory.

8. **Global Error Handler** (`ApiGateway/server.ts:62-79`) — Catches `AppError` instances by type, plus `uncaughtException` and `unhandledRejection` process hooks.

## Performance (Verified)

| Metric | Value |
|--------|-------|
| Throughput | 32 req/sec (local), 400+ (cloud) |
| Avg response | 7.9s (local), <100ms (cloud) |
| Concurrent tested | 500 (10K total requests) |
| Rate limit blocked | 98.2% attack traffic |
| Zero crashes | ✅ |

## Design Patterns Used (12 total)

- Singleton (Redis, DB, Razorpay, Factory)
- Factory (GatewayFactory)
- Strategy (RazerPayProvider implements IPaymentGateway)
- Proxy (PaymentGatewayProxy — retry + shield)
- Template Method (BaseTemplate — validate → initiate → confirm)
- Observer (Redis pub/sub in build plan)
- Facade (PaymentService hides complexity)
- Repository (planned — TransactionRepository)
- Middleware Chain (Express — auth → rate-limit → validate → controller)
- Global Error Handler (centralized AppError)
- Idempotency Pattern (DB-first + 11000 catch)
- HMAC Signature Verification (incoming webhooks + outgoing)

## Key Documentation

- `HOWIDID.md` — 374-line public guide on building and scaling the platform
- `PayGate_Build_Plan.md` — 876-line 12-week curriculum (Redis → Design Patterns → System Design → Interviews)
- `SHOWCASE.md` — Technical showcase with architecture diagram and talking points
- `PROJECT-CONTEXT.md` — Condensed project overview and Java conversion plan

## Goal

Convert to Java Spring Boot to teach Java students, help them get jobs, and grow course reach.
