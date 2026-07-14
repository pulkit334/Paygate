import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc.js";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth.js";
import AppError from "../utils/Error.js";

const router = express.Router();

router.get(
  "/provider-keys",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      PaymentClient.GetProviderKeys({ appId }, (err: any, response: any) => {
        if (err) return next(AppError.Payment(err.message));
        res.status(200).json(response);
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/provider-keys",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const { provider, keyId, keySecret } = req.body;
      if (!provider || !keyId || !keySecret) {
        throw AppError.Validation("provider, keyId, and keySecret are required");
      }

      PaymentClient.UpdateProviderKey(
        { appId, provider, keyId, keySecret },
        (err: any, response: any) => {
          if (err) return next(AppError.Payment(err.message));
          res.status(200).json(response);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/provider-keys/:provider",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const { provider } = req.params;

      PaymentClient.DeleteProviderKey(
        { appId, provider },
        (err: any, response: any) => {
          if (err) return next(AppError.Payment(err.message));
          res.status(200).json(response);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
