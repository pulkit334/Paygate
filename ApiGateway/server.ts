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
import { JwtAuthMiddleware } from "./Middleware/jwtAuth";
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
