import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth.js";
import AppError from "../utils/Error.js";

const router = express.Router();

router.get(
  "/webhooks",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { from, limit, offset } = req.query;
      const appId = (req as any).merchant._id;

      if (!appId) {
        throw AppError.Validation("Unauthorized");
      }

      const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || "http://localhost:4000";
      const response = await axios.get(`${WEBHOOK_SERVICE_URL}/api/webhooks`, {
        params: { appId, from, limit, offset },
      });

      res.status(200).json(response.data);
    } catch (error) {
      next(
        AppError.Webhook(
          error instanceof Error ? error.message : "Failed to fetch webhooks",
        ),
      );
    }
  },
);

export default router;
