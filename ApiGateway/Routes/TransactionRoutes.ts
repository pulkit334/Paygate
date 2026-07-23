import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc.js";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth.js";
import AppError from "../utils/Error.js";

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

      PaymentClient.GetTransctions({ appId, from, to, limit, offset }, (err: any, response: any) => {
        if (err) return next(AppError.Payment(err.message));
        res.status(200).json(response);
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/ledger",
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      PaymentClient.GetLedger({ appId }, (err: any, response: any) => {
        if (err) return next(AppError.Payment(err.message));
        res.status(200).json(response);
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
