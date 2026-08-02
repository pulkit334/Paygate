import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc.js";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth.js";
import AppError from "../utils/Error.js";
import { callWithPolicy } from "../GrpcRef/paymentGrpcclient.js";

const router = express.Router();

router.get(
  "/provider-keys",
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const response = await callWithPolicy(PaymentClient, "GetProviderKeys", { appId });
      res.status(200).json(response);
    } catch (error: any) {
      next(error instanceof AppError ? error : AppError.Payment(error.message));
    }
  }
);

router.post(
  "/provider-keys",
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const { provider, keyId, keySecret } = req.body;
      if (!provider || !keyId || !keySecret) {
        throw AppError.Validation("provider, keyId, and keySecret are required");
      }

      const response = await callWithPolicy(PaymentClient, "UpdateProviderKey", { appId, provider, keyId, keySecret });
      res.status(200).json(response);
    } catch (error: any) {
      next(error instanceof AppError ? error : AppError.Payment(error.message));
    }
  }
);

router.delete(
  "/provider-keys/:provider",
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const { provider } = req.params;

      const response = await callWithPolicy(PaymentClient, "DeleteProviderKey", { appId, provider });
      res.status(200).json(response);
    } catch (error: any) {
      next(error instanceof AppError ? error : AppError.Payment(error.message));
    }
  }
);

export default router;
