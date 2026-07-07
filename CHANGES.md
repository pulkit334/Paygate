# Changes: Cookie-Based → Session-Based Auth

## Overview

Converted the authentication system from JWT-in-headers (cookie-based) to express-session with Redis-backed session store. The JWT is now stored server-side in the session — the client never sees it. Auth is purely via an HttpOnly session cookie (`pg.sid`).

---

## Files Changed

### 1. `ApiGateway/Middleware/session.ts` — Session middleware (core change)

**Before:** Session store used a separate `ioredis` client created inline. Cookie config had `secure: process.env.NODE_ENV === "production"`. No typed session data. Used `connect-redis` v9 import style (`{ RedisStore }`).

**After:**
- Uses shared `redisClient` from `config/redis.ts` (ioredis, connects automatically)
- Downgraded `connect-redis` from v9 → v7 (v9 requires `redis` node-redis package which needs `.connect()`, v7 works natively with ioredis)
- Import changed: `{ RedisStore }` → `RedisStore` (default export in v7)
- Added typed session interface: `SessionData` has `activeApp: string`, `userApps: string[]`, `tokens: Record<string, AppToken>`
- Each `AppToken` stores `{ jwt, issuedAt, expiresAt }` — JWT lives server-side only
- Cookie: `secure: false` (for HTTP localhost), `sameSite: "lax"`, `httpOnly: true`, 7-day TTL
- Session secret falls back to `"paygate-session-secret-dev-only"` in non-production
- Redis prefix: `pg:sess:`, TTL: 604800s (7 days)

**Why:** The original `connect-redis@9` was incompatible with `ioredis` — it sent Redis `SET` commands with object args (`[object Object]`) instead of `EX 604800`, causing `ERR syntax error`. Sessions could never be saved. Downgrading to v7 fixed this.

---

### 2. `ApiGateway/config/redis.ts` — Redis client config

**Before:** Plain `new Redis(REDIS_URL)` with no options.

**After:** Added `maxRetriesPerRequest: 3` and `retryStrategy` with exponential backoff (min 2s). Removed the separate `sessionRedisClient` (node-redis) that was added during debugging.

**Why:** `maxRetriesPerRequest` prevents gRPC and rate-limit commands from retrying indefinitely. The retry strategy prevents rapid reconnection loops.

---

### 3. `ApiGateway/server.ts` — Server entry point

**Before:** Had unused `helmet` import (removed earlier). Error handler returned generic `{ error: "Internal server error" }`.

**After:**
- Removed unused comments
- Error handler returns `{ error, message: err }` for non-AppError errors (helps debugging)
- Simple `app.listen()` — no async bootstrap needed (ioredis connects automatically, connect-redis@7 works with it)

**Why:** Earlier attempts with `connect-redis@9` + `redis` v6 required async `await connectSessionRedis()` before `app.listen()`. Downgrading to v7 eliminated this.

---

### 4. `ApiGateway/Routes/MerhcantRoutes.ts` — Login & Register routes

**Before:**
- Login: `merchantClient.Login(grpcPayload, callback)` — no deadline, error handling was `AppError.Auth(err.message, 401)` for all gRPC errors
- Register: `callbackUrl` sent as `""` (empty string), which backend Zod rejected as "Invalid URL"
- All gRPC errors mapped to same HTTP status (401)

**After:**
- Login: Added per-call `{ deadline }` (10s) to gRPC call
- Register: `callbackUrl` only included when truthy (`|| undefined` instead of `|| ""`)
- All gRPC errors use `mapGrpcError()` which maps gRPC status codes to correct HTTP status:
  - `UNAVAILABLE` → 503
  - `UNAUTHENTICATED` → 401
  - `ALREADY_EXISTS` → 409
  - `INVALID_ARGUMENT` → 400
  - `NOT_FOUND` → 404
- Added deadlines to `CreateApiKey` and `DeleteApiKey` calls too
- Import changed: `{ merchantClient }` → `{ merchantClient, GRPC_DEADLINE_MS }`

**Why:**
- `grpc.deadline_ms` in channel options was silently ignored by `@grpc/grpc-js` — deadlines must be per-call
- Empty string `callbackUrl` failed Zod's `.url()` validation on the backend
- All gRPC errors returning 401 hid the real cause (backend down = 503, duplicate email = 409, bad input = 400)

---

### 5. `ApiGateway/Routes/SessionRoutes.ts` — Session management routes

**Before:**
- `POST /session/switch`: Set `req.session.activeApp = appId` but **never sent a response** — Express hung forever, frontend got no data
- `DELETE /session/apps/:appId`: `const { appId } = req.params` — TypeScript error (`string | string[]`)
- No explicit `req.session.save()` before responding

**After:**
- `POST /session/switch`: Explicitly calls `req.session.save()`, then sends `{ success, activeApp, expiresAt }`
- `DELETE /session/apps/:appId`: `const appId = req.params.appId as string` — fixes TS error
- TypeScript type safety improved

**Why:**
- Missing response on switch caused frontend to hang / get no data, breaking the AppSwitcher
- Race condition: without explicit `save()`, session might not be in Redis before `window.location.reload()` hit `GET /session`

---

### 6. `ApiGateway/GrpcRef/Grpc.ts` — gRPC client setup

**Before:** No keepalive, no deadline, `grpc.deadline_ms` in channel options (silently ignored).

**After:**
- Added `grpc.keepalive_time_ms: 30000` and `grpc.keepalive_timeout_ms: 10000` to channel options
- Removed `grpc.deadline_ms` from channel options (not a valid option)
- Exported `GRPC_DEADLINE_MS = 10_000` for per-call use
- Both `merchantClient` and `PaymentClient` have keepalive

**Why:**
- Keepalive prevents TCP connections from going stale during idle periods
- `grpc.deadline_ms` was a dead option — `@grpc/grpc-js` ignores unknown channel options silently

---

### 7. `ApiGateway/utils/grpcErrors.ts` — NEW FILE

**Created:** Maps gRPC status codes to HTTP status codes via `mapGrpcError()` function. Also exports `grpcStatusName()` for debugging.

**Why:** Before, all gRPC errors returned 401. Now:
- `UNAVAILABLE` (14) → 503 Service Unavailable
- `UNAUTHENTICATED` (16) → 401 Unauthorized
- `ALREADY_EXISTS` (6) → 409 Conflict
- `INVALID_ARGUMENT` (3) → 400 Bad Request
- `NOT_FOUND` (5) → 404 Not Found
- `INTERNAL` (13) → 503 Service Unavailable

---

### 8. `frontend/src/src/components/Navbar.tsx` — Shared navbar

**Before:** No session loading on mount. `AppSwitcher` relied on Redux state that was only populated after login.

**After:**
- Added `useEffect` that calls `fetchSession()` on mount when `sessionLoaded` is false
- Uses typed `AppDispatch` for `useDispatch`
- Imports `fetchSession` and `useSelector`

**Why:** After `window.location.reload()` (triggered by app switch), Redux state was empty. No component called `fetchSession()` on mount, so `activeApp` and `userApps` stayed `[]`, and `AppSwitcher` returned `null` (hidden).

---

### 9. `frontend/src/src/toolkit/user-redux-toll/user-redux.tsx` — Redux state management

**Before (`logoutSingleApp.fulfilled`):**
```ts
state.userApps = state.userApps.filter((a) => a.appId !== appId);
```
Locally filtered `userApps` — desynced from server when `activeApp` changed.

**After:**
```ts
if (result.authenticated === false) {
  state.activeApp = null;
  state.userApps = [];
} else if (result.userApps) {
  state.userApps = result.userApps;
  state.activeApp = result.activeApp;
}
```
Uses server's `userApps` list (from `buildAppsList()` which has correct `isActive` flags).

**Why:** Local filter didn't update `isActive` on remaining apps. After removing the active app, the server switches `activeApp` to another, but Redux showed stale `isActive` states, causing the AppSwitcher to collapse or show wrong active state.

---

### 10. `backend/controller/app.controller.ts` — Backend login controller

**Before:** Had `console.log(process.env.JWT_SECRET)` — leaked secret to stdout.

**After:** Removed the `console.log`.

**Why:** Security — JWT secret should never be logged.

---

## What Was NOT Changed

- **Frontend auth service** (`auth.service.ts`): Already sends `{ email, password }` as JSON POST with `withCredentials: true`. No changes needed.
- **Frontend Axios client** (`client.ts`): Already had `withCredentials: true` which sends the `pg.sid` cookie automatically. No changes needed.
- **Frontend Login/Register pages**: Already send credentials correctly. No changes needed.
- **Backend gRPC service**: Still issues JWTs, still does bcrypt. The JWT is just stored server-side now instead of sent to the client.
- **Frontend AppSwitcher**: Already renders from Redux state. No changes needed (the Redux fix handles it).

---

## Package Changes

| Package | Before | After | Why |
|---------|--------|-------|-----|
| `connect-redis` | v9.0.0 | v7.1.1 | v9 requires `redis` node-redis package; v7 works with ioredis directly |
| `redis` (node-redis) | v6.1.0 | Removed | No longer needed — connect-redis@7 uses ioredis |

---

## The Session Flow (Before vs After)

### Before (Cookie-based with JWT in headers)
```
Login → Backend returns JWT → Gateway sends JWT to client → Client stores in localStorage
→ Client sends JWT in Authorization header on every request → Gateway verifies JWT
```

### After (Session-based)
```
Login → Backend returns JWT → Gateway stores JWT in session (Redis)
→ Browser receives Set-Cookie: pg.sid → Client sends cookie automatically
→ Gateway reads session from Redis, extracts JWT → Gateway verifies JWT via gRPC
```

### Key Differences
| Aspect | Before | After |
|--------|--------|-------|
| Where JWT lives | Client (localStorage/header) | Server (Redis session) |
| Client sees JWT | Yes | No |
| Session cookie | None | `pg.sid` (HttpOnly, SameSite=Lax) |
| Session store | None | Redis (`pg:sess:` prefix, 7-day TTL) |
| Multi-app support | No | Yes (multiple JWTs per session) |
| App switching | Login again | Switch in session, no re-login |
| Logout | Clear localStorage | Destroy session in Redis + clear cookie |
| XSS risk | JWT in localStorage = vulnerable | HttpOnly cookie = protected |
| CSRF risk | Low (header-based) | Mitigated by SameSite=Lax |

---

## Bugs Fixed During This Work

1. **Session never saved** — `connect-redis@9` + `ioredis` incompatibility (ERR syntax error)
2. **Register 401** — Actually a validation error (empty `callbackUrl` string, password < 8 chars)
3. **Login 401** — Session save failing (same Redis issue as #1)
4. **Login 500** — `connect-redis@9` + `redis@6` client not connected before first request
5. **AppSwitcher disappears after reload** — No `fetchSession()` called on page mount
6. **Session switch hangs** — `POST /session/switch` never sent a response
7. **Session switch removes all tabs** — Redux reducer used local filter instead of server response
8. **gRPC hangs forever** — `grpc.deadline_ms` in channel options silently ignored
9. **All errors return 401** — gRPC status codes not mapped to HTTP status
10. **JWT secret logged to stdout** — `console.log(process.env.JWT_SECRET)` in backend
