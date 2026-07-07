import session from "express-session";
import RedisStore from "connect-redis";
import { redisClient } from "../config/redis";

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

const isProduction = process.env.NODE_ENV === "production";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET && isProduction) {
  throw new Error(
    "SESSION_SECRET environment variable must be set in production",
  );
}
const sessionSecret = SESSION_SECRET || "paygate-session-secret-dev-only";

const sessionMiddleware = session({
  store: new RedisStore({
    client: redisClient,
    prefix: "pg:sess:",
    ttl: SESSION_TTL_MS / 1000,
  }),
  secret: sessionSecret,
  name: "pg.sid",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: SESSION_TTL_MS,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  },
});

export default sessionMiddleware;
