import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import AppError from "../utils/Error";

const router = express.Router();

router.get(
  "/webhooks",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { from, limit, offset } = req.query;
      const appId = (req as any).merchant._id;

      if (!appId) {
        throw AppError.Validation("Unauthorized");
      }

      const response = await axios.get("http://localhost:4000/api/webhooks", {
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
