# Session-Based Auth Flow

## Architecture

```
Frontend (React :5173)  →  API Gateway (Express :6283)  →  Backend (gRPC :50051)  →  MongoDB
                              ↕
                           Redis (session store)
```

- **Cookie:** `pg.sid` (HttpOnly, SameSite=Lax, 7-day TTL)
- **Session store:** Redis with prefix `pg:sess:`
- **JWT:** Stored server-side in session, never sent to client

---

## Registration

```
Frontend (Register.tsx)
  → POST /api/v1/auth/register  { name, email, password, callbackUrl }
  → API Gateway (MerhcantRoutes.ts:99)
    → gRPC Auth → Backend (RegisterAppController)
      → app.service.ts: bcrypt.hash(password), generate API keys, save to MongoDB
      → Returns { publicKey, secretKey }
    → NO session created
  → Response 201: { publicKey, secretKey }
  → Frontend redirects to /login
```

**Key files:**
- `frontend/src/src/pages/Register.tsx` — form, calls `register()`, navigates to `/login`
- `frontend/src/src/services/auth.service.ts:48` — `register()` sends POST
- `ApiGateway/Routes/MerhcantRoutes.ts:99` — register handler, forwards to gRPC
- `backend/controller/app.controller.ts:12` — `RegisterAppController`
- `backend/service/app.service.ts:5` — hashes password, creates app, returns keys

---

## Login

```
Frontend (Login.tsx)
  → POST /api/v1/auth/login  { email, password }
  → API Gateway (MerhcantRoutes.ts:28)
    1. gRPC Login → Backend (LoginController)
       → bcrypt.compare, sign JWT { appId, exp: 7d }
       → Returns JWT token
    2. Gateway decodes JWT → extracts appId
    3. Stores in session:
       req.session.tokens[appId] = { jwt, issuedAt, expiresAt }
       req.session.userApps = [appId, ...]
       req.session.activeApp = appId
    4. req.session.save() → writes to Redis
  → Response 200: { success, appId, userApps, tokenExpiresAt }
  → Browser receives Set-Cookie: pg.sid=<sid>
  → Frontend dispatches fetchSession() → GET /session (cookie sent automatically)
  → Redux stores session data → navigate to /dashboard
```

**Key files:**
- `frontend/src/src/pages/Login.tsx:15` — form submit, calls `login()`, dispatches `fetchSession()`
- `frontend/src/src/services/auth.service.ts:64` — `login()` sends POST
- `frontend/src/src/services/client.ts:12` — Axios with `withCredentials: true`
- `ApiGateway/Routes/MerhcantRoutes.ts:28` — login handler, stores JWT in session
- `ApiGateway/Middleware/session.ts:32` — session config (RedisStore, cookie settings)
- `backend/controller/app.controller.ts:46` — `LoginController`, bcrypt + JWT sign

---

## Session Validation (Protected Routes)

```
Frontend → any request to /api/v1/api-keys or /api/v2/*
  → Browser sends pg.sid cookie automatically
  → API Gateway session middleware → loads session from Redis
  → JwtAuthMiddleware (Middleware/jwtAuth.ts):
    1. req.session.activeApp → which app user is operating as
    2. req.session.tokens[activeApp].jwt → the JWT for that app
    3. Local expiry check (30s buffer)
    4. gRPC MiddlewareAuth → Backend verifies JWT signature
    5. Attaches req.merchant._id = appId
  → Route handler proceeds
```

**Key files:**
- `frontend/src/src/services/client.ts` — both `MerchantApi` and `PaymentApi` use `withCredentials: true`
- `ApiGateway/Middleware/jwtAuth.ts` — reads JWT from session, verifies via gRPC
- `ApiGateway/server.ts:62-67` — routes using `JwtAuthMiddleware`
- `backend/controller/app.controller.ts` — `MiddlewareAuth` handler

---

## App Switching (Multi-App Session)

```
Frontend (AppSwitcher.tsx) → dispatch(switchActiveApp(appId))
  → POST /session/switch  { appId }
  → API Gateway (SessionRoutes.ts:53):
    1. Validate appId exists in req.session.tokens
    2. Check token isn't expired
    3. Set req.session.activeApp = appId
    4. express-session auto-saves to Redis
  → Response: { success, activeApp, expiresAt }
  → Frontend: window.location.reload()
```

**Key files:**
- `frontend/src/src/components/AppSwitcher.tsx` — switch UI
- `frontend/src/src/toolkit/user-redux-toll/user-redux.tsx` — `switchActiveApp` thunk
- `ApiGateway/Routes/SessionRoutes.ts:53` — switch handler

---

## Logout

```
Navbar → handleLogout() → POST /session/logout
  → API Gateway (SessionRoutes.ts:84):
    1. req.session.destroy() → deletes from Redis
    2. res.clearCookie("pg.sid") → browser discards cookie
  → Response: { success, destroyedSessionId }
  → Frontend: dispatch(resetUser()) → clears Redux → navigate to /
```

**Key files:**
- `frontend/src/src/components/Navbar.tsx` — logout button
- `frontend/src/src/services/auth.service.ts:96` — `logoutSession()` sends POST
- `ApiGateway/Routes/SessionRoutes.ts:84` — destroy session + clear cookie

---

## Single App Removal

```
AppSwitcher → dispatch(logoutSingleApp(appId))
  → DELETE /session/apps/:appId
  → API Gateway (SessionRoutes.ts:100):
    1. delete req.session.tokens[appId]
    2. Remove from req.session.userApps
    3. If removed app was active → switch to first remaining
    4. If no apps left → destroy entire session + clear cookie
```

**Key files:**
- `frontend/src/src/components/AppSwitcher.tsx` — remove button
- `ApiGateway/Routes/SessionRoutes.ts:100` — delete handler

---

## Redis Key Structure

```
Key:    pg:sess:<session-id>
TTL:    604800 (7 days)

Value:
{
  "cookie": { "maxAge": 604800000, "httpOnly": true, "secure": false, "sameSite": "lax" },
  "activeApp": "64a1b2c3...",
  "userApps": ["64a1b2c3...", "64a1d4e5..."],
  "tokens": {
    "64a1b2c3...": {
      "jwt": "eyJhbGciOiJIUzI1NiIs...",
      "issuedAt": 1688000000000,
      "expiresAt": 1688604800000
    }
  }
}
```

---

## Flow Diagrams

### Complete Login → Protected Request

```
Browser                    API Gateway                 Redis              Backend (gRPC)
  |                           |                         |                     |
  |-- POST /auth/login ------>|                         |                     |
  |   {email, password}       |--- gRPC Login -------->|------------------>  |
  |                           |                         |    bcrypt.compare   |
  |                           |<-- JWT token -----------|<------------------  |
  |                           |                         |                     |
  |                           |-- decode JWT            |                     |
  |                           |   extract appId         |                     |
  |                           |                         |                     |
  |                           |   req.session.tokens    |                     |
  |                           |     [appId] = {jwt}     |                     |
  |                           |   req.session.save()    |                     |
  |                           |---- SET pg:sess:sid --->|                     |
  |                           |                         |                     |
  |<-- 200 + Set-Cookie ------|                         |                     |
  |   pg.sid=<sid>            |                         |                     |
  |                           |                         |                     |
  |-- GET /session ---------->|                         |                     |
  |   Cookie: pg.sid          |---- GET pg:sess:sid --->|                     |
  |                           |<-- session data ---------|                     |
  |<-- 200 {authenticated} ---|                         |                     |
  |                           |                         |                     |
  |-- GET /api-keys --------->|                         |                     |
  |   Cookie: pg.sid          |---- GET pg:sess:sid --->|                     |
  |                           |<-- session data ---------|                     |
  |                           |   JwtAuthMiddleware     |                     |
  |                           |--- gRPC MiddlewareAuth ->|----------------->  |
  |                           |<-- {valid, appId} ------|<-----------------  |
  |<-- 200 {apiKeys} ---------|                         |                     |
```

### Session Data Lifecycle

```
Register → no session created → redirect to /login
Login    → session created in Redis → Set-Cookie sent
Switch   → activeApp changed in session → auto-saved to Redis
Logout   → session destroyed in Redis → cookie cleared
Remove   → app removed from session → if last app, session destroyed
```
