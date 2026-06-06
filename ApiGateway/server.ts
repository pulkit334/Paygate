import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import { RedisStore } from "rate-limit-redis";
import rateLimit from "express-rate-limit";
dotenv.config();

import MerchantRoutes from "./Routes/MerhcantRoutes";
import PaymentRoutes from "./Routes/PaymentRoutes";
import WebhookRoutes from "./Routes/webhookRoutes";
import { JwtAuthMiddleware } from "./Middleware/jwtAuth";
import { redisClient } from "./config/redis";

const app = express();


app.use("/webhook/razorpay", express.raw({ type: "application/json" }));

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(helmet());


const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => (redisClient as any).call(...args),
  }),
  message: { success: false, message: "Too many requests" },
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => (redisClient as any).call(...args),
  }),
  message: { success: false, message: "Too many payment requests" },
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api/v1", generalLimiter, MerchantRoutes);
app.use("/api/v2", paymentLimiter, JwtAuthMiddleware, PaymentRoutes);
app.use("/webhook", WebhookRoutes);

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 6283;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});