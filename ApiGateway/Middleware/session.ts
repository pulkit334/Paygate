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

const sessionMiddleware = session({
  store: new RedisStore({
    client: sessionClient,
    prefix: "pg:sess:",
    ttl: SESSION_TTL_MS / 1000,
  }) as any,
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
