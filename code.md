# Code Changes - All Session & Auth Related Files

---

## 1. ApiGateway/.env

```env
DB="mongodb+srv://pulkittales12_db_user:faZL26PuHlbfZr4c@merchantservice.a5dpgsg.mongodb.net/benchmarkdb"
# PORT=3986
PORT=6283
JWT_SECRET=PK8UBB
REDIS_URL=redis://localhost:6379                        
  //redis://redis:6379
WEBHOOK_SIGNING_SECRET=Xmac
GRPC_PORT=50001
SESSION_SECRET=XBSHHDHGHDHD
```

---

## 2. ApiGateway/Middleware/session.ts

```typescript
import session from "express-session";
import { RedisStore } from "connect-redis";
import Redis from "ioredis";

export interface AppToken {
  jwt: string;
  issuedAt: number;
  expiresAt: number;
}

declare module "express-session" {
  interface SessionData {
    activeApp: string;
    userApps: string[];
    tokens: Record<string, AppToken>;
  }
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const JWT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export { SESSION_TTL_MS, JWT_TTL_MS };

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const sessionClient = new Redis(REDIS_URL);

sessionClient.on("error", (err) => console.error("Session Redis error:", err));
sessionClient.on("connect", () => console.log("Session Redis connected"));

const baseStore = new RedisStore({
  client: sessionClient,
  prefix: "pg:sess:",
  ttl: SESSION_TTL_MS / 1000,
});

// Wrap store methods to log what's actually happening
const origGet = baseStore.get.bind(baseStore);
const origSet = baseStore.set.bind(baseStore);
const origDestroy = baseStore.destroy.bind(baseStore);
const origTouch = baseStore.touch.bind(baseStore);

baseStore.get = function (sid: string, callback: (err: any, session?: any) => void) {
  console.log(`[Store] GET ${sid}`);
  origGet(sid, (err: any, session: any) => {
    console.log(`[Store] GET result: ${err ? "ERROR " + err.message : session ? "FOUND (activeApp=" + session.activeApp + ")" : "MISS"}`);
    callback(err, session);
  });
};

baseStore.set = function (sid: string, session: any, callback?: (err?: any) => void) {
  console.log(`[Store] SET ${sid} — activeApp=${session.activeApp}, tokens=${Object.keys(session.tokens || {}).length}`);
  origSet(sid, session, (err: any) => {
    console.log(`[Store] SET result: ${err ? "ERROR " + err.message : "OK"}`);
    if (callback) callback(err);
  });
};

baseStore.destroy = function (sid: string, callback?: (err?: any) => void) {
  console.log(`[Store] DESTROY ${sid}`);
  origDestroy(sid, (err: any) => {
    if (callback) callback(err);
  });
};

baseStore.touch = function (sid: string, session: any, callback?: (err?: any) => void) {
  console.log(`[Store] TOUCH ${sid}`);
  origTouch(sid, session, (err: any) => {
    if (callback) callback(err);
  });
};

const sessionMiddleware = session({
  store: baseStore as any,
  secret: process.env.SESSION_SECRET || "paygate-session-secret-change-in-production",
  name: "pg.sid",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: SESSION_TTL_MS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
});

export default sessionMiddleware;
```

---

## 3. ApiGateway/Middleware/jwtAuth.ts

```typescript
import { Request, Response, NextFunction } from "express";
import { merchantClient } from "../GrpcRef/Grpc";
import AppError from "../utils/Error";

const JwtAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Debug: log session state
    console.log("[Auth] cookies:", req.cookies);
    console.log("[Auth] sessionID:", req.sessionID);
    console.log("[Auth] session:", JSON.stringify(req.session, null, 2));

    // Check if session exists and has active app
    if (!req.session || !req.session.activeApp) {
      console.log("[Auth] BLOCKED: no active session");
      throw AppError.Validation("No active session. Please login.");
    }

    const appId = req.session.activeApp;
    const tokenData = req.session.tokens?.[appId];

    if (!tokenData) {
      throw AppError.Validation("No token found for active app. Please login to this app.");
    }

    // Check if token is expired (clock skew: add 30s buffer)
    const now = Date.now();
    const bufferMs = 30 * 1000;
    if (tokenData.expiresAt && now > tokenData.expiresAt + bufferMs) {
      return res.status(401).json({
        error: "Token expired for this app",
        type: "TOKEN_EXPIRED",
        appId,
        message: `Token for app ${appId} has expired. Please re-login to this app.`,
      });
    }

    // Verify token via gRPC (still validates JWT integrity + backend trust)
    merchantClient.MiddlewareAuth({ token: tokenData.jwt }, (err: any, response: any) => {
      if (err) {
        return next(AppError.Auth("Token verification failed"));
      }
      if (!response?.valid) {
        return next(AppError.Auth("Invalid token"));
      }

      (req as any).merchant = {
        _id: response.appId,
      };

      next();
    });
  } catch (error) {
    next(error);
  }
};

export { JwtAuthMiddleware };
```

---

## 4. ApiGateway/Middleware/validate_APi_Key.ts

```typescript
import { NextFunction, Request, Response } from "express";
import { merchantClient } from "../GrpcRef/Grpc";
import AppError from "../utils/Error";

const ApiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      throw AppError.Validation("API key is required");
    }
    if (!apiKey.toLowerCase().startsWith("sk_live_")) {
      throw AppError.Validation("Invalid API key format");
    }

    console.log("Validating API key:", apiKey);

    merchantClient.ValidateApiKey({ apiKey }, (err: any, response: any) => {
      if (err) {
        return next(AppError.Service("Auth service unavailable"));
      }
      if (!response?.valid) {
        return next(AppError.Auth("Invalid API key", 401));
      }
      
      (req as any).app = {
        _id: response.appId,
        merchantId: response.merchantId,
      };
      
      next();
    });
  } catch (error) {
    next(error);
  }
};

export { ApiKeyMiddleware };
```

---

## 5. ApiGateway/server.ts

```typescript
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import { RedisStore } from "rate-limit-redis";
import rateLimit from "express-rate-limit";
dotenv.config();
import AppError from "./utils/Error";
import MerchantRoutes from "./Routes/MerhcantRoutes";
import PaymentRoutes from "./Routes/PaymentRoutes";
import WebhookRoutes from "./Routes/webhookRoutes";
import WebhookHistoryRoutes from "./Routes/WebhookHistoryRoutes";
import ApiKeyRoutes from "./Routes/ApiKeyRoutes";
import AnalyticsRoutes from "./Routes/AnalyticsRoutes";
import ProviderKeyRoutes from "./Routes/ProviderKeyRoutes";
import SessionRoutes from "./Routes/SessionRoutes";
import { JwtAuthMiddleware } from "./Middleware/jwtAuth";
import sessionMiddleware from "./Middleware/session";
import { redisClient } from "./config/redis";
const app = express();

app.use("/webhook/razorpay", express.raw({ type: "application/json" }));

// CORS
app.use(cors({
  origin : "http://localhost:5173",
  credentials: true,
}));

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
// app.use(helmet());

// Session middleware (before rate limiters and routes)
app.use(sessionMiddleware);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => (redisClient as any).call(...args),
  }),
  message: { success: false, message: "Too many requests" },
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => (redisClient as any).call(...args),
  }),
  message: { success: false, message: "Too many payment requests" },
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "sahi hai bhi" });
});

// Session routes (no auth needed)
app.use("/api/v1", SessionRoutes);

app.use("/api/v1", generalLimiter, MerchantRoutes);
app.use("/api/v1/api-keys", JwtAuthMiddleware, ApiKeyRoutes);
app.use("/api/v2", paymentLimiter, JwtAuthMiddleware, PaymentRoutes);
app.use("/api/v2", JwtAuthMiddleware, WebhookHistoryRoutes);
app.use("/api/v2", AnalyticsRoutes);
app.use("/api/v2", ProviderKeyRoutes);
app.use("/webhook", WebhookRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      type: err.type,
    });
  }
  res.status(500).json({ error: "Internal server error" });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err.message);
  process.exit(1);
});

process.on("unhandledRejection", (message) => {
  console.error("unhandeld exception:", message);
});

const PORT = process.env.PORT || 6283;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
```

---

## 6. ApiGateway/Routes/SessionRoutes.ts

```typescript
import express, { Request, Response, NextFunction } from "express";
import AppError from "../utils/Error";

const router = express.Router();

// Helper: check if a token is expired
const isTokenExpired = (expiresAt: number): boolean => {
  return Date.now() > expiresAt + 30 * 1000; // 30s buffer
};

// Helper: build app list with status
const buildAppsList = (session: any) => {
  const apps: Array<{
    appId: string;
    isActive: boolean;
    issuedAt: number;
    expiresAt: number;
    expired: boolean;
  }> = [];

  for (const appId of session.userApps || []) {
    const tokenData = session.tokens?.[appId];
    if (tokenData) {
      apps.push({
        appId,
        isActive: appId === session.activeApp,
        issuedAt: tokenData.issuedAt,
        expiresAt: tokenData.expiresAt,
        expired: isTokenExpired(tokenData.expiresAt),
      });
    }
  }
  return apps;
};

// GET /session - get current session info with per-app status
router.get("/session", (req: Request, res: Response) => {
  if (!req.session.activeApp) {
    return res.status(200).json({
      authenticated: false,
      activeApp: null,
      userApps: [],
    });
  }

  const activeToken = req.session.tokens?.[req.session.activeApp];
  const activeAppExpired = activeToken ? isTokenExpired(activeToken.expiresAt) : true;

  res.status(200).json({
    authenticated: true,
    activeApp: req.session.activeApp,
    activeAppExpired,
    userApps: buildAppsList(req.session),
  });
});

// POST /session/switch - switch active app (validates token isn't expired)
router.post("/session/switch", (req: Request, res: Response) => {
  const { appId } = req.body;

  if (!appId) {
    throw AppError.Validation("appId is required");
  }

  const tokenData = req.session.tokens?.[appId];

  if (!tokenData) {
    throw AppError.Validation("App not found in session. Please login to this app first.");
  }

  // Validate token isn't expired before switching
  if (isTokenExpired(tokenData.expiresAt)) {
    return res.status(401).json({
      error: "TOKEN_EXPIRED",
      message: `Token for app ${appId} has expired. Please re-login to this app.`,
      appId,
    });
  }

  req.session.activeApp = appId;

  res.status(200).json({
    success: true,
    activeApp: appId,
    expiresAt: tokenData.expiresAt,
  });
});

// POST /session/logout - destroy session (logout from ALL apps, ALL devices)
router.post("/session/logout", (req: Request, res: Response) => {
  const sid = req.sessionID;

  req.session.destroy((err: any) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.clearCookie("pg.sid");
    res.status(200).json({
      success: true,
      message: "Logged out from all apps on this device",
      destroyedSessionId: sid,
    });
  });
});

// DELETE /session/apps/:appId - logout from a specific app only
router.delete("/session/apps/:appId", (req: Request, res: Response) => {
  const { appId } = req.params;

  if (!req.session.tokens || !req.session.tokens[appId]) {
    throw AppError.Validation("App not found in session");
  }

  // Remove the app token from session
  delete req.session.tokens[appId];
  req.session.userApps = (req.session.userApps || []).filter((id: string) => id !== appId);

  // If we logged out of the active app, switch to another one
  if (req.session.activeApp === appId) {
    const remaining = req.session.userApps;
    req.session.activeApp = remaining.length > 0 ? remaining[0] : "";
  }

  // If no apps left, destroy entire session
  if (req.session.userApps.length === 0) {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Failed to clear session" });
      }
      res.clearCookie("pg.sid");
      return res.status(200).json({
        success: true,
        message: "Last app removed. Session cleared.",
        authenticated: false,
      });
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: `Logged out from app ${appId}`,
    activeApp: req.session.activeApp,
    userApps: buildAppsList(req.session),
  });
});

export default router;
```

---

## 7. ApiGateway/Routes/PaymentRoutes.ts

```typescript
import express, { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { merchantClient, PaymentClient } from "../GrpcRef/Grpc";
import { ApiKeyMiddleware } from "../Middleware/validate_APi_Key";
import AppError from "../utils/Error";

const router = express.Router();

router.post(
  "/create",
  ApiKeyMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      if (!req.body.amount) {
        throw AppError.Validation("Amount is required");
      }
      if (req.body.amount < 1) {
        throw AppError.Validation("Amount must be greater than 0");
      }
      if (!req.body.currency) {
        throw AppError.Validation("Currency is required");
      }

      const Grpcpayload = {
        appId: (req as any).app._id,
        amount: req.body.amount,
        currency: req.body.currency,
        customerName: req.body.customerName,
        metadata: req.body.metadata || "",
        idempotencyKey: req.body.idempotencyKey || crypto.randomUUID(),
        customoreEmail: req.body.customoreEmail,
        Provider: req.body.Provider,
      };

      PaymentClient.CreateOrder(Grpcpayload, (err: any, Response: any) => {
        if (err) {
          return next(AppError.Payment(err.message));
        }
        res.status(200).json(Response);
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/verify", async (req: Request, res: Response, next) => {
  try {
    if (!req.body.razorpay_order_id) {
      throw AppError.Validation("razorpay_order_id is required");
    }
    if (!req.body.razorpay_payment_id) {
      throw AppError.Validation("razorpay_payment_id is required");
    }
    if (!req.body.razorpay_signature) {
      throw AppError.Validation("razorpay_signature is required");
    }

    const GrpcPayLoad = {
      razorpay_order_id: req.body.razorpay_order_id,
      razorpay_payment_id: req.body.razorpay_payment_id,
      razorpay_signature: req.body.razorpay_signature,
    };

    PaymentClient.Verify(GrpcPayLoad, (err: any, Response: any) => {
      if (err) {
        return next(AppError.Payment(err.message));
      }
      res.status(200).json(Response);
    });
  } catch (error) {
    next(error);
  }
});

router.get("/transactions", async (req: Request, res: Response, next) => {
  try {
    const appId = (req as any).merchant._id;

    if (!appId) throw AppError.Validation("Unauthorized");

    const { from, to, limit = "50", offset = "0" } = req.query;

    const grpcPayload = {
      appId,
      from: from || "",
      to: to || "",
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    };

    PaymentClient.GetTransctions(grpcPayload, (err: any, Response: any) => {
      if (err) {
        return next(AppError.Payment(err.message));
      }
      res.status(200).json(Response);
    });
  } catch (error) {
    next(error);
  }
});

router.get("/ledger", async (req: Request, res: Response, next) => {
  try {
    const appId = (req as any).merchant._id;
    if (!appId) throw AppError.Validation("Unauthorized");

    PaymentClient.GetLedger({ appId }, (err: any, Response: any) => {
      if (err) {
        return next(AppError.Payment(err.message));
      }
      res.status(200).json(Response);
    });
  } catch (err) {
    next(err);
  }
});

export default router;
```

---

## 8. ApiGateway/Routes/AnalyticsRoutes.ts

```typescript
import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth";
import AppError from "../utils/Error";

const router = express.Router();

router.get(
  "/analytics/summary",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      PaymentClient.GetAnalyticsSummary({ appId }, (err: any, response: any) => {
        if (err) return next(AppError.Payment(err.message));
        res.status(200).json(response);
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/analytics/daily",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const days = parseInt((req.query.days as string) || "7", 10);

      PaymentClient.GetDailyVolume({ appId, days }, (err: any, response: any) => {
        if (err) return next(AppError.Payment(err.message));
        res.status(200).json(response.days || []);
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
```

---

## 9. ApiGateway/Routes/ProviderKeyRoutes.ts

```typescript
import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth";
import AppError from "../utils/Error";

const router = express.Router();

router.get(
  "/provider-keys",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      PaymentClient.GetProviderKeys({ appId }, (err: any, response: any) => {
        if (err) return next(AppError.Payment(err.message));
        res.status(200).json(response);
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/provider-keys",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const { provider, keyId, keySecret } = req.body;
      if (!provider || !keyId || !keySecret) {
        throw AppError.Validation("provider, keyId, and keySecret are required");
      }

      PaymentClient.UpdateProviderKey(
        { appId, provider, keyId, keySecret },
        (err: any, response: any) => {
          if (err) return next(AppError.Payment(err.message));
          res.status(200).json(response);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/provider-keys/:provider",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const { provider } = req.params;

      PaymentClient.DeleteProviderKey(
        { appId, provider },
        (err: any, response: any) => {
          if (err) return next(AppError.Payment(err.message));
          res.status(200).json(response);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

---

## 10. ApiGateway/Routes/WebhookHistoryRoutes.ts

```typescript
import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth";
import AppError from "../utils/Error";

const router = express.Router();

router.get(
  "/webhooks",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { from, limit, offset } = req.query;
      const appId = (req as any).merchant._id;

      if (!appId) {
        throw AppError.Validation("Unauthorized");
      }

      const response = await axios.get("http://localhost:4000/api/webhooks", {
        params: { appId, from, limit, offset },
      });

      res.status(200).json(response.data);
    } catch (error) {
      next(
        AppError.Webhook(
          error instanceof Error ? error.message : "Failed to fetch webhooks",
        ),
      );
    }
  },
);

export default router;
```

---

## 11. frontend/src/services/client.ts

```typescript
import axios, { type AxiosInstance } from "axios";

// Session-based auth: no need to attach Authorization header
// The session cookie (pg.sid) is sent automatically by the browser

const attachInterceptors = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const originalRequest = error.config;
      const url = originalRequest?.url || "";
      const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/session");

      if (status === 401 && !isAuthRoute) {
        window.location.replace("/login");
      }

      return Promise.reject(error);
    },
  );
};

export const MerchantApi = axios.create({
  baseURL: "http://localhost:6283/api/v1",
  withCredentials: true,
});
attachInterceptors(MerchantApi);

export const PaymentApi = axios.create({
  baseURL: "http://localhost:6283/api/v2",
  withCredentials: true,
});
attachInterceptors(PaymentApi);

export const api = PaymentApi;
export default api;
```

---

## 12. frontend/src/services/auth.service.ts

```typescript
import { isAxiosError } from 'axios'
import { MerchantApi } from './client'

export const AUTH = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  callbackUrl?: string
}

export interface RegisterResponse {
  publicKey: string
  secretKey: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  appId: string
  userApps: string[]
  tokenExpiresAt: number
}

export interface AppInfo {
  appId: string
  isActive: boolean
  issuedAt: number
  expiresAt: number
  expired: boolean
}

export interface SessionResponse {
  authenticated: boolean
  activeApp: string | null
  activeAppExpired: boolean
  userApps: AppInfo[]
}

export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await MerchantApi.post(AUTH.REGISTER, data)
    return response.data
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err.response?.data?.code
      const status = err.response?.status
      if (code === 'USER_EXISTS' || status === 409) {
        throw new Error('An account with this email already exists', { cause: err })
      }
    }
    throw err
  }
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await MerchantApi.post(AUTH.LOGIN, data)
    return response.data
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err.response?.data?.code
      if (code === 'USER_NOT_FOUND') {
        throw new Error('Invalid email or password', { cause: err })
      }
      if (code === 'ACCOUNT_DISABLED') {
        throw new Error('Account has been disabled', { cause: err })
      }
    }
    throw err
  }
}

export const getSession = async (): Promise<SessionResponse> => {
  try {
    const response = await MerchantApi.get('/session')
    return response.data
  } catch {
    return { authenticated: false, activeApp: null, activeAppExpired: false, userApps: [] }
  }
}

export const switchApp = async (appId: string): Promise<{ success: boolean; activeApp: string; expiresAt: number }> => {
  const response = await MerchantApi.post('/session/switch', { appId })
  return response.data
}

export const logoutSession = async (): Promise<void> => {
  await MerchantApi.post('/session/logout')
}

export const logoutApp = async (appId: string) => {
  const response = await MerchantApi.delete(`/session/apps/${appId}`)
  return response.data
}
```

---

## 13. frontend/src/hooks/useAuth.ts

```typescript
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession } from '../services/auth.service'

export const useAuth = () => {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession()
        setAuthed(session.authenticated)
        if (!session.authenticated) {
          navigate('/login')
        }
      } catch {
        setAuthed(false)
        navigate('/login')
      }
    }

    checkSession()
  }, [navigate])

  return { authed: authed ?? false }
}
```

---

## 14. frontend/src/toolkit/user-redux-toll/user-redux.tsx

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { MerchantApi } from "../../services/client";
import { getSession, switchApp, logoutSession, logoutApp, type AppInfo } from "../../services/auth.service";

interface ApiKey {
  _id: string;
  name: string;
  publicKey: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

interface UserState {
  apiKeys: ApiKey[];
  loading: boolean;
  error: string | null;
  newlyCreatedKey: string | null;
  activeApp: string | null;
  activeAppExpired: boolean;
  userApps: AppInfo[];
  sessionLoaded: boolean;
}

const initialState: UserState = {
  apiKeys: [],
  loading: false,
  error: null,
  newlyCreatedKey: null,
  activeApp: null,
  activeAppExpired: false,
  userApps: [],
  sessionLoaded: false,
};

// Fetch current session info
export const fetchSession = createAsyncThunk(
  "user/fetchSession",
  async (_, { rejectWithValue }) => {
    try {
      const session = await getSession();
      return session;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch session");
    }
  },
);

// Switch active app
export const switchActiveApp = createAsyncThunk(
  "user/switchApp",
  async (appId: string, { rejectWithValue }) => {
    try {
      await switchApp(appId);
      return appId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to switch app");
    }
  },
);

// Logout from all apps
export const logoutAllApps = createAsyncThunk(
  "user/logoutAll",
  async (_, { rejectWithValue }) => {
    try {
      await logoutSession();
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to logout");
    }
  },
);

// Logout from a specific app
export const logoutSingleApp = createAsyncThunk(
  "user/logoutApp",
  async (appId: string, { rejectWithValue }) => {
    try {
      const result = await logoutApp(appId);
      return { appId, result };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to logout from app");
    }
  },
);

export const fetchApiKeys = createAsyncThunk(
  "user/fetchApiKeys",
  async (_, { rejectWithValue }) => {
    try {
      const response = await MerchantApi.get("/api-keys");
      const data = response.data?.data;
      const keys = response.data?.keys || [];

      if (keys.length > 0) {
        return { keys };
      }

      if (data?.publicKey) {
        return {
          keys: [
            {
              _id: data._id || "legacy",
              name: "Default Key",
              publicKey: data.publicKey,
              isActive: data.isActive !== false,
              createdAt: data.createdAt || new Date().toISOString(),
              expiresAt: null,
            },
          ],
        };
      }

      return { keys: [] };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch API keys",
      );
    }
  },
);

export const createApiKey = createAsyncThunk(
  "user/createApiKey",
  async (payload: { name: string; expiresAt: Date | null }, { rejectWithValue }) => {
    try {
      const response = await MerchantApi.post("/register-new/api-key", {
        name: payload.name,
        expiresAt: payload.expiresAt,
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create API key",
      );
    }
  },
);

export const deleteApiKey = createAsyncThunk(
  "user/deleteApiKey",
  async (keyId: string, { rejectWithValue }) => {
    try {
      await MerchantApi.delete(`/api-keys/${keyId}`);
      return keyId;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete API key",
      );
    }
  },
);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearNewlyCreatedKey: (state) => {
      state.newlyCreatedKey = null;
    },
    resetUser: (state) => {
      state.apiKeys = [];
      state.loading = false;
      state.error = null;
      state.newlyCreatedKey = null;
      state.activeApp = null;
      state.activeAppExpired = false;
      state.userApps = [];
      state.sessionLoaded = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Session
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.activeApp = action.payload.activeApp;
        state.activeAppExpired = action.payload.activeAppExpired;
        state.userApps = action.payload.userApps;
        state.sessionLoaded = true;
      })
      .addCase(fetchSession.rejected, (state) => {
        state.activeApp = null;
        state.activeAppExpired = false;
        state.userApps = [];
        state.sessionLoaded = true;
      })
      .addCase(switchActiveApp.fulfilled, (state, action) => {
        state.activeApp = action.payload;
        state.activeAppExpired = false;
      })
      .addCase(logoutAllApps.fulfilled, (state) => {
        state.activeApp = null;
        state.activeAppExpired = false;
        state.userApps = [];
        state.apiKeys = [];
      })
      .addCase(logoutSingleApp.fulfilled, (state, action) => {
        const { appId, result } = action.payload;
        state.userApps = state.userApps.filter((a) => a.appId !== appId);
        if (result.activeApp) {
          state.activeApp = result.activeApp;
        } else if (result.authenticated === false) {
          state.activeApp = null;
          state.activeAppExpired = false;
          state.userApps = [];
        }
      })
      // API Keys
      .addCase(fetchApiKeys.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApiKeys.fulfilled, (state, action) => {
        state.loading = false;
        state.apiKeys = action.payload.keys || [];
      })
      .addCase(fetchApiKeys.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createApiKey.fulfilled, (state, action) => {
        state.apiKeys.push({
          _id: action.payload.id,
          name: action.payload.name,
          publicKey: action.payload.publicKey,
          isActive: true,
          createdAt: action.payload.createdAt,
          expiresAt: action.payload.expiresAt || null,
        });
        state.newlyCreatedKey = action.payload.secretKey;
      })
      .addCase(deleteApiKey.fulfilled, (state, action) => {
        state.apiKeys = state.apiKeys.filter((k) => k._id !== action.payload);
      });
  },
});

export const { clearNewlyCreatedKey, resetUser } = userSlice.actions;
export default userSlice.reducer;
```

---

## 15. frontend/src/components/Navbar.tsx

```typescript
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { LayoutDashboard, ArrowLeftRight, Webhook, Settings, LogOut, BookOpen, Menu, X } from 'lucide-react'
import { logoutSession } from '../services/auth.service'
import { resetUser } from '../toolkit/user-redux-toll/user-redux'
import AppSwitcher from './AppSwitcher'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logoutSession()
    } catch {
      // Session might already be invalid
    }
    dispatch(resetUser())
    document.cookie = 'pg.sid=; path=/; max-age=0'
    navigate('/')
  }

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { path: '/webhooks', label: 'Webhooks', icon: Webhook },
    { path: '/docs', label: 'Docs', icon: BookOpen },
  ]

  links.push({ path: '/settings', label: 'Settings', icon: Settings })

  return (
    <nav className="sticky top-0 z-40 border-b border-border/50 bg-bg-primary/85 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-text-primary rotate-45 rounded-sm" />
                <span className="relative text-white font-bold text-sm font-[family-name:var(--font-display)]">P</span>
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight hidden sm:block font-[family-name:var(--font-display)]">PayGate</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link key={link.path} to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.03]'
                  }`}>
                  <link.icon size={16} />
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <AppSwitcher />

            <button onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger/10 transition-all">
              <LogOut size={16} />
              Logout
            </button>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-text-secondary hover:text-text-primary">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-bg-primary/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => {
              const isActive = location.pathname === link.path
              return (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all ${
                    isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.03]'
                  }`}>
                  <link.icon size={16} />
                  {link.label}
                </Link>
              )
            })}
            <div className="py-2">
              <AppSwitcher />
            </div>
            <hr className="border-border/50 my-2" />
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger/10 w-full">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
```

---

## 16. frontend/src/components/AppSwitcher.tsx

```typescript
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { RootState, AppDispatch } from '../store'
import { switchActiveApp, logoutSingleApp } from '../toolkit/user-redux-toll/user-redux'
import type { AppInfo } from '../services/auth.service'
import { ChevronDown, Check, LogOut, Plus, AlertTriangle, Clock } from 'lucide-react'

const AppSwitcher = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { activeApp, userApps } = useSelector((state: RootState) => state.user)
  const [open, setOpen] = useState(false)

  if (!activeApp || userApps.length === 0) return null

  const formatTimeLeft = (expiresAt: number): string => {
    const now = Date.now()
    const diff = expiresAt - now
    if (diff <= 0) return 'Expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d left`
    }
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  const handleSwitch = async (app: AppInfo) => {
    if (app.appId === activeApp) {
      setOpen(false)
      return
    }

    if (app.expired) {
      // Token expired — redirect to login for this app
      setOpen(false)
      navigate('/login')
      return
    }

    const result = await dispatch(switchActiveApp(app.appId))
    if (switchActiveApp.fulfilled.match(result)) {
      setOpen(false)
      window.location.reload()
    } else {
      // Switch failed (likely token expired between check and switch)
      setOpen(false)
      navigate('/login')
    }
  }

  const handleRemove = async (e: React.MouseEvent, appId: string) => {
    e.stopPropagation()
    if (confirm(`Remove app ${appId.slice(0, 8)}... from session?`)) {
      const result = await dispatch(logoutSingleApp(appId))
      if (logoutSingleApp.fulfilled.match(result)) {
        if (!result.payload.result.activeApp && result.payload.result.authenticated === false) {
          navigate('/login')
        } else {
          window.location.reload()
        }
      }
    }
    setOpen(false)
  }

  const handleAddNew = () => {
    navigate('/login')
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
      >
        <div className="w-6 h-6 bg-accent/10 rounded flex items-center justify-center">
          <span className="text-xs font-bold text-accent">{activeApp.slice(0, 2).toUpperCase()}</span>
        </div>
        <span className="hidden sm:block max-w-[100px] truncate font-mono text-xs">{activeApp}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-[10px] shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-border">
              <p className="text-xs text-text-muted">Switch App ({userApps.length} in session)</p>
            </div>

            <div className="p-2 max-h-60 overflow-y-auto">
              {userApps.map((app) => (
                <button
                  key={app.appId}
                  onClick={() => handleSwitch(app)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                    app.appId === activeApp
                      ? 'bg-accent/10 text-accent'
                      : app.expired
                        ? 'text-text-muted hover:bg-bg-elevated'
                        : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                  }`}
                >
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                    app.appId === activeApp ? 'bg-accent/20' : 'bg-bg-elevated'
                  }`}>
                    <span className="text-xs font-bold">{app.appId.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-mono text-xs truncate">{app.appId}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {app.expired ? (
                        <span className="flex items-center gap-1 text-xs text-danger">
                          <AlertTriangle size={10} />
                          Expired — click to re-login
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Clock size={10} />
                          {formatTimeLeft(app.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  {app.appId === activeApp && <Check size={14} className="text-accent shrink-0" />}
                  {app.appId !== activeApp && !app.expired && (
                    <button
                      onClick={(e) => handleRemove(e, app.appId)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-danger/10 rounded transition-all shrink-0"
                      title="Remove from session"
                    >
                      <LogOut size={12} className="text-danger" />
                    </button>
                  )}
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-border">
              <button
                onClick={handleAddNew}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-all"
              >
                <div className="w-8 h-8 rounded flex items-center justify-center bg-success-soft">
                  <Plus size={14} className="text-success" />
                </div>
                <span>Add another app</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AppSwitcher
```

---

## 17. frontend/src/pages/Login.tsx

```typescript
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { login } from '../services/auth.service'
import { fetchSession } from '../toolkit/user-redux-toll/user-redux'

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

const handleSubmit = async (e: React.SyntheticEvent) => {
  e.preventDefault();
  setLoading(true)
  setError('')
  try {
    await login({ email, password })
    // Session cookie is set automatically by the browser
    // Fetch session data into Redux
    await dispatch(fetchSession())
    navigate('/dashboard')
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Login failed')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-text-primary rotate-45 rounded-sm" />
            <span className="relative text-white font-bold text-lg font-[family-name:var(--font-display)]">P</span>
          </div>
          <span className="text-2xl font-bold text-text-primary tracking-tight font-[family-name:var(--font-display)]">PayGate</span>
        </Link>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h1 className="text-xl font-bold text-text-primary mb-1">Sign in</h1>
          <p className="text-sm text-text-muted mb-6">Access your payment dashboard</p>

          {error && (
            <div className="mb-4 p-3 bg-danger-soft border border-danger/20 rounded-lg text-sm text-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-all" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-text-muted text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
```

---

## 18. frontend/src/pages/Register.tsx

```typescript
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/auth.service'

const Register = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register({ name, email, password, callbackUrl: callbackUrl || undefined })
      navigate('/login')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-text-primary rotate-45 rounded-sm" />
            <span className="relative text-white font-bold text-lg font-[family-name:var(--font-display)]">P</span>
          </div>
          <span className="text-2xl font-bold text-text-primary tracking-tight font-[family-name:var(--font-display)]">PayGate</span>
        </Link>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h1 className="text-xl font-bold text-text-primary mb-1">Create account</h1>
          <p className="text-sm text-text-muted mb-6">Get started with PayGate</p>

          {error && (
            <div className="mb-4 p-3 bg-danger-soft border border-danger/20 rounded-lg text-sm text-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Callback URL <span className="text-text-muted">(optional)</span></label>
              <input type="url" value={callbackUrl} onChange={e => setCallbackUrl(e.target.value)} placeholder="https://your-app.com/webhook"
                className="w-full px-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-all" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-text-muted text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
```

---

## 19. frontend/src/pages/Settings.tsx

```typescript
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { fetchApiKeys, createApiKey, deleteApiKey, clearNewlyCreatedKey } from '../toolkit/user-redux-toll/user-redux'
import Navbar from '../components/Navbar'
import ProviderConnect from '../components/ProviderConnect'
import SecretKeyModal from '../components/SecretKeyModal'
import ApiKeysPanel from '../components/ApiKeysPanel'
import { getSettings, rotateKeys, updateCallbackUrl } from '../services/settings.service'
import { Key, Link, AlertTriangle, Copy, Check, Shield, RefreshCw, CreditCard, User, Webhook } from 'lucide-react'

type Tab = 'profile' | 'providers' | 'api-keys' | 'webhooks' | 'security'

const tabs: { id: Tab; label: string; icon: typeof Key }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'providers', label: 'Payment Providers', icon: CreditCard },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'security', label: 'Security', icon: Shield },
]

const Settings = () => {
  const dispatch = useDispatch()
  const { apiKeys, loading: keysLoading, newlyCreatedKey } = useSelector((state: RootState) => state.user)
  const [activeTab, setActiveTab] = useState<Tab>('providers')

  const [publicKey, setPublicKey] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newCallbackUrl, setNewCallbackUrl] = useState('')
  const [showRotateConfirm, setShowRotateConfirm] = useState(false)
  const [newKeys, setNewKeys] = useState<{ publicKey: string; secretKey: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    dispatch(fetchApiKeys() as any)
    getSettings()
      .then((data) => {
        setCallbackUrl(data.callbackUrl)
        setNewCallbackUrl(data.callbackUrl)
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load settings'))
      .finally(() => setLoading(false))
  }, [dispatch])

  useEffect(() => {
    if (apiKeys.length > 0 && apiKeys[0].publicKey) {
      setPublicKey(apiKeys[0].publicKey)
    }
  }, [apiKeys])

  const handleUpdateCallback = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateCallbackUrl(newCallbackUrl)
      setCallbackUrl(newCallbackUrl)
      setSuccess('Webhook URL updated successfully')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update webhook URL')
    } finally {
      setSaving(false)
    }
  }

  const handleRotate = async () => {
    setShowRotateConfirm(false)
    setError('')
    try {
      const result = await rotateKeys()
      setNewKeys({ publicKey: result.publicKey, secretKey: result.secretKey })
      setPublicKey(result.publicKey)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Key rotation failed')
    }
  }

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (newKeys) {
    return <SecretKeyModal publicKey={newKeys.publicKey} onSaved={() => setNewKeys(null)} />
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">Settings</h1>
          <p className="text-sm text-text-muted mt-1">Manage your account, providers, and integration settings</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-danger-soft border border-danger/20 rounded-md text-danger text-sm flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-success-soft border border-success/20 rounded-md text-success text-sm flex items-center gap-2">
            <Check size={14} /> {success}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-56 shrink-0">
            <nav className="bg-surface border border-border rounded-[10px] p-2 lg:sticky lg:top-24">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setError(''); setSuccess('') }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === id
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-black/[0.03]'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* Profile */}
            {activeTab === 'profile' && (
              <div className="bg-surface border border-border rounded-[10px] p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-1">Profile</h2>
                <p className="text-sm text-text-muted mb-6">Your account information</p>
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="text-xs text-text-muted block mb-1.5">Email</label>
                    <code className="block w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-sm font-mono text-text-primary">
                      developer@example.com
                    </code>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1.5">Plan</label>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 px-4 py-3 bg-bg-primary border border-border rounded-lg text-sm font-mono text-text-primary">
                        Starter (Free)
                      </code>
                      <button className="px-4 py-2.5 text-sm font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/5 transition-all whitespace-nowrap">
                        Upgrade
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Providers */}
            {activeTab === 'providers' && (
              <div className="bg-surface border border-border rounded-[10px] p-6">
                <ProviderConnect />
              </div>
            )}

            {/* API Keys */}
            {activeTab === 'api-keys' && (
              <ApiKeysPanel
                keys={apiKeys.map((k: any) => ({
                  id: k._id || k.id || '',
                  name: k.name || 'API Key',
                  maskedKey: k.publicKey || '',
                  createdAt: k.createdAt || new Date().toISOString(),
                  expiresAt: k.expiresAt || null,
                  isActive: k.isActive !== false,
                }))}
                onCreateKey={(name, expiresAt) => {
                  dispatch(createApiKey({ name, expiresAt }) as any)
                }}
                onDeleteKey={(keyId) => {
                  dispatch(deleteApiKey(keyId) as any)
                }}
                isLoading={keysLoading}
                newlyCreatedKey={newlyCreatedKey}
                onDismissNewKey={() => dispatch(clearNewlyCreatedKey())}
              />
            )}

            {/* Webhooks */}
            {activeTab === 'webhooks' && (
              <div className="bg-surface border border-border rounded-[10px] p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-1">Webhook URL</h2>
                <p className="text-sm text-text-muted mb-6">Where payment events are sent</p>

                {loading ? (
                  <div className="animate-pulse h-32 bg-bg-elevated rounded-lg" />
                ) : (
                  <div className="space-y-4 max-w-lg">
                    <div>
                      <label className="text-xs text-text-muted block mb-1.5">Current URL</label>
                      <code className="block w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-sm font-mono text-text-primary">
                        {callbackUrl || <span className="text-text-muted italic">Not configured</span>}
                      </code>
                    </div>

                    <form onSubmit={handleUpdateCallback}>
                      <label className="text-xs text-text-muted block mb-1.5">Update URL</label>
                      <div className="flex gap-3">
                        <input type="url" value={newCallbackUrl} onChange={(e) => setNewCallbackUrl(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all text-sm"
                          placeholder="https://api.myapp.com/webhooks/paygate" />
                        <button type="submit" disabled={saving}
                          className="px-6 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg font-medium transition-all text-sm whitespace-nowrap">
                          {saving ? 'Saving...' : 'Update'}
                        </button>
                      </div>
                    </form>

                    <div className="bg-info-soft border border-info/20 rounded-lg px-4 py-3">
                      <p className="text-xs text-info font-medium">How webhooks work</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        PayGate sends POST requests to your URL when payment events occur.
                        Each request includes an HMAC-SHA256 signature for verification.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="bg-surface border border-border rounded-[10px] p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-1">Security</h2>
                <p className="text-sm text-text-muted mb-6">Authentication and access controls</p>

                <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
                  {[
                    { label: 'JWT Authentication', value: 'Enabled', color: 'text-success', bg: 'bg-success-soft' },
                    { label: 'API Key Auth', value: 'Active', color: 'text-success', bg: 'bg-success-soft' },
                    { label: 'Rate Limiting', value: '100 req/min', color: 'text-success', bg: 'bg-success-soft' },
                    { label: 'Webhook Signing', value: 'HMAC-SHA256', color: 'text-success', bg: 'bg-success-soft' },
                    { label: 'Encryption at Rest', value: 'AES-256', color: 'text-success', bg: 'bg-success-soft' },
                    { label: 'Idempotency', value: 'Enabled', color: 'text-success', bg: 'bg-success-soft' },
                  ].map((item) => (
                    <div key={item.label} className="bg-bg-primary border border-border rounded-lg p-4">
                      <div className="text-xs text-text-muted mb-1">{item.label}</div>
                      <div className={`text-sm font-semibold ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {showRotateConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-[10px] max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-danger-soft rounded-full">
                <AlertTriangle size={20} className="text-danger" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Rotate API Keys?</h3>
                <p className="text-sm text-text-muted mt-1">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
              Current keys will <span className="text-danger font-medium">stop working immediately</span>.
              Any services using the old keys will need to be updated.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRotateConfirm(false)}
                className="px-5 py-2.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-black/[0.03] transition-all">
                Cancel
              </button>
              <button onClick={handleRotate}
                className="px-5 py-2.5 text-sm font-medium text-white bg-danger hover:bg-red-600 rounded-lg transition-all">
                Rotate Keys
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
```

---

## 20. frontend/src/pages/Dashboard.tsx

```typescript
import { useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "../components/Navbar";
import SummaryCard from "../components/SummaryCard";
import TransactionTable from "../components/TransactionTable";
import { fetchDashboardData, refreshDashboardData } from "../toolkit/dashboard/dashboard-slice";
import type { RootState, AppDispatch } from "../store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  IndianRupee,
  Activity,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const REFRESH_INTERVAL = 60_000;

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const Navigate = useNavigate();
  const intervalRef = useRef<number | null>(null);

  const { summary, payments, dailyVolume, ledger, loading, refreshing, error } =
    useSelector((state: RootState) => state.dashboard);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        dispatch(refreshDashboardData());
      }
    }, REFRESH_INTERVAL);
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchDashboardData());
    startAutoRefresh();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        dispatch(refreshDashboardData());
        startAutoRefresh();
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [dispatch, startAutoRefresh]);

  const handleRefresh = () => {
    dispatch(refreshDashboardData());
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-display">
              Dashboard
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Welcome back, Acme Corp
            </p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-md text-text-secondary text-sm hover:bg-bg-elevated transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-success-soft border border-success/20 rounded-md text-success text-sm">
              <TrendingUp size={16} />
              <span className="font-medium">+12.5% this month</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger-soft border border-danger/20 rounded-md text-danger text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-[10px] p-5 animate-pulse h-24"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface border border-border rounded-[10px] p-6 animate-pulse h-64" />
              <div className="bg-surface border border-border rounded-[10px] p-6 animate-pulse h-64" />
            </div>
          </>
        ) : (
          <>
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <SummaryCard
                  label="Total Volume"
                  value={formatAmount(summary?.totalReceived ?? 0)}
                  icon={<IndianRupee size={20} />}
                  trend="+12% vs yesterday"
                  trendUp
                />
                <SummaryCard
                  label="Total Transactions"
                  value={summary?.totalTransactions?.toLocaleString("en-IN") ?? "0"}
                  icon={<Activity size={20} />}
                />
                <SummaryCard
                  label="Success Rate"
                  value={summary?.successRate != null ? `${summary.successRate}%` : "0%"}
                  icon={<CheckCircle size={20} />}
                  trend="Stable"
                  trendUp
                />
                <SummaryCard
                  label="Last Payment"
                  value={
                    summary.lastPaymentAt
                      ? new Date(summary.lastPaymentAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "N/A"
                  }
                  icon={<Clock size={20} />}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary font-display">
                    Recent Transactions
                  </h2>
                  <span
                    onClick={() => Navigate("/transactions")}
                    className="text-xs text-accent flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    View all <ArrowUpRight size={12} />
                  </span>
                </div>
                <TransactionTable payments={payments} loading={false} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary font-display">
                    Daily Volume
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    Last 7 days
                  </div>
                </div>
                <div className="bg-surface border border-border rounded-[10px] p-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={dailyVolume} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#55556A", fontSize: 12 }}
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })
                        }
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#55556A", fontSize: 12 }}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#111118",
                          border: "1px solid #2A2A38",
                          borderRadius: "8px",
                          color: "#F0F0FF",
                        }}
                        formatter={(value) => [
                          formatAmount(value as number),
                          "Volume",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#6C63FF"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#6C63FF", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#6C63FF", stroke: "#111118", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-surface border border-border rounded-[10px] p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Wallet size={18} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Wallet Balance</p>
                  <p className="text-lg font-bold text-text-primary">
                    {formatAmount(ledger?.balanceAfter ?? 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-soft rounded-lg flex items-center justify-center">
                  <TrendingUp size={18} className="text-success" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Settlements Pending</p>
                  <p className="text-lg font-bold text-text-primary">
                    {formatAmount(ledger?.amount ?? 0)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-text-muted">
                Auto-updates every 60s
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
```
