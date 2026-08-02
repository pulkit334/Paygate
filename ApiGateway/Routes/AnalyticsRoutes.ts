import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc.js";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth.js";
import AppError from "../utils/Error.js";
import { callWithPolicy } from "../GrpcRef/paymentGrpcclient.js";

const router = express.Router();

router.get(
  "/analytics/summary",
  
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const response = await callWithPolicy(PaymentClient, "GetAnalyticsSummary", { appId });
      res.status(200).json(response);
    } catch (error: any) {
      next(error instanceof AppError ? error : AppError.Payment(error.message));
    }
  },
);

router.get(
  "/analytics/daily",
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const days = parseInt((req.query.days as string) || "7", 10);

      const response: any = await callWithPolicy(PaymentClient, "GetDailyVolume", { appId, days });
      res.status(200).json(response.days || []);
    } catch (error: any) {
      next(error instanceof AppError ? error : AppError.Payment(error.message));
    }
  },
);

export default router;
