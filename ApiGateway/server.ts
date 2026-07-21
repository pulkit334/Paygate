import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { RedisStore } from "rate-limit-redis";
import rateLimit from "express-rate-limit";
dotenv.config();
import AppError from "./utils/Error.js";
import MerchantRoutes from "./Routes/MerhcantRoutes.js";
import PaymentRoutes from "./Routes/PaymentRoutes.js";
import WebhookRoutes from "./Routes/webhookRoutes.js";
import WebhookHistoryRoutes from "./Routes/WebhookHistoryRoutes.js";
import ApiKeyRoutes from "./Routes/ApiKeyRoutes.js";
import AnalyticsRoutes from "./Routes/AnalyticsRoutes.js";
import ProviderKeyRoutes from "./Routes/ProviderKeyRoutes.js";
import TransactionRoutes from "./Routes/TransactionRoutes.js";
import SessionRoutes from "./Routes/SessionRoutes.js";
import { JwtAuthMiddleware } from "./Middleware/jwtAuth.js";
import sessionMiddleware from "./Middleware/session.js";
import { redisClient } from "./config/redis.js";
const app = express();

// Behind nginx (TLS termination) — trust X-Forwarded-Proto so secure cookies are set
app.set("trust proxy", 1);

app.use("/webhook/razorpay", express.raw({ type: "application/json" }));

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

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
app.use("/api/v1", SessionRoutes);
app.use("/api/v1", generalLimiter, MerchantRoutes);
app.use("/api/v1/api-keys", JwtAuthMiddleware, ApiKeyRoutes);
app.use("/api/v2/payment", paymentLimiter, PaymentRoutes);
app.use("/api/v2", JwtAuthMiddleware, WebhookHistoryRoutes);
app.use("/api/v2", AnalyticsRoutes);
app.use("/api/v2", TransactionRoutes);
app.use("/api/v2", ProviderKeyRoutes);
app.use("/webhook", WebhookRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      type: err.type,
    });
  }
  res.status(500).json({ error: "Internal server error", message : err});
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
