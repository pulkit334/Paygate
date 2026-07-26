import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import { redisClient, waitForConnection } from "./config/redis";
import { ConnectDb } from "./config/database";
import webhookRoutes from "./Routes/route";
import { startWebhookService } from "./services/webhook_service";
import { BackgroundDLQ } from "./config/dlq";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.use("/api", webhookRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status ?? 500).json({
    success: false,
    code: err.code ?? "INTERNAL_ERROR",
    message: err.message ?? "Something went wrong",
  });
});

// Boot sequence function to ensure safe, sequential startup
const startServer = async () => {
  try {
    // 1. Establish Database & Cache Connections First
    console.log("[SYSTEM] Connecting to MongoDB and Redis...");
    await ConnectDb();
    await waitForConnection();
    console.log("[SYSTEM] Databases connected successfully.");

    // 2. Start HTTP Express Server
    app.listen(PORT, () => {
      console.log(`[SYSTEM] Express server listening on port ${PORT}`);
    });

    // 3. Register Background Services
    // BackgroundDLQ registers the cron rule with node-cron instantly (non-blocking)
    BackgroundDLQ();
    console.log("[CRON] DLQ Background Scheduler initialized.");

    // startWebhookService starts the real-time stream processing loop
    startWebhookService();
    console.log("[WORKER] Real-Time Webhook Consumer initialized.");

  } catch (error) {
    console.error("[FATAL ERROR] Failed to start server:", error);
    process.exit(1);
  }
};

startServer();