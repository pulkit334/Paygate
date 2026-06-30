import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth";
import AppError from "../utils/Error";

const router = express.Router();

router.get(
  "/analytics/daily",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;

      if (!appId) throw AppError.Validation("Unauthorized");

      const days = parseInt((req.query.days as string) || "7", 10);

      PaymentClient.GetDailyVolume({ appId, days }, (err: any, response: any) => {
        if (err) {
          return next(AppError.Payment(err.message));
        }
        res.status(200).json(response.days || []);
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
