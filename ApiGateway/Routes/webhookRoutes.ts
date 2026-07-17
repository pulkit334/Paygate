import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc.js";
import AppError from "../utils/Error.js";

const router = express.Router();

router.post("/razorpay", async (req: Request, res: Response, next) => {
  try {
    const signature = (req.headers["x-razorpay-signature"] as string) || "";
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
    const parsedBody = typeof req.body === "string" ? JSON.parse(req.body) : JSON.parse(req.body.toString());

    const result = await new Promise((resolve, reject) => {
      PaymentClient.WebhookBody(
        {
          signature,
          body: parsedBody,
          raw_body: rawBody,
        },
        (err: any, response: any) => {
          if (err) reject(err);
          else resolve(response);
        },
      );
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
