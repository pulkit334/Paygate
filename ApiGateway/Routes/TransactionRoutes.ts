import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc.js";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth.js";
import AppError from "../utils/Error.js";
import { callWithPolicy } from "../GrpcRef/paymentGrpcclient.js";

const router = express.Router();

router.get(
  "/transactions",
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const limit = parseInt((req.query.limit as string) || "10", 10);
      const offset = parseInt((req.query.offset as string) || "0", 10);
      const from = (req.query.from as string) || "";
      const to = (req.query.to as string) || "";

      const response = await callWithPolicy(PaymentClient, "GetTransctions", { appId, from, to, limit, offset });
      res.status(200).json(response);
    } catch (error: any) {
      next(error instanceof AppError ? error : AppError.Payment(error.message));
    }
  },
);

router.get(
  "/ledger",
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const response = await callWithPolicy(PaymentClient, "GetLedger", { appId });
      res.status(200).json(response);
    } catch (error: any) {
      next(error instanceof AppError ? error : AppError.Payment(error.message));
    }
  },
);

export default router;
