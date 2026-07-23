import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { redisClient, waitForConnection } from "./config/redis";
import { ConnectDb } from "./config/database";
import morgan from "morgan";
import webhookRoutes from "./Routes/route";
dotenv.config();
import { startWebhookService } from "./services/webhook_service";
import { BackgroundDLQ } from "./config/dlq";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api", webhookRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status ?? 500).json({
    success: false,
    code: err.code ?? "INTERNAL_ERROR",
    message: err.message ?? "Something went wrong",
  });
});

app.listen(PORT, async () => {
  await ConnectDb();
  await waitForConnection();
  console.log(`Server is listening on port ${PORT}`);
  startWebhookService();
  BackgroundDLQ();
});
