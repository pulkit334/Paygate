import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc";
import AppError from "../utils/Error";

const router = express.Router();

router.post("/razorpay", async (req: Request, res: Response, next) => {
  try {
    if (!req.headers["x-razorpay-signature"]) {
      throw AppError.Validation("Missing x-razorpay-signature header");
    }
    if (!req.body) {
      throw AppError.Validation("Missing webhook body");
    }

    const result = await PaymentClient.payWebhook({
      signature: req.headers["x-razorpay-signature"],
      body: req.body,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(
      AppError.Webhook(
        error instanceof Error ? error.message : "Webhook processing failed",
      ),
    );
  }
});

export default router;
