import express, { NextFunction, Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc.js";
import AppError from "../utils/Error.js";
import { callWithPolicy } from "../GrpcRef/paymentGrpcclient.js";

const router = express.Router();

router.post("/razorpay", async (req: Request, res: Response, next : NextFunction) => {
  try {
    const signature = (req.headers["x-razorpay-signature"] as string) || "";
    let rawBody: string;
    let parsedBody: any;

    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString();
      parsedBody = JSON.parse(rawBody);
    } else if (typeof req.body === "string") {
      rawBody = req.body;
      parsedBody = JSON.parse(rawBody);
    } else {
      parsedBody = req.body;
      rawBody = JSON.stringify(req.body);
    }

    const result = await callWithPolicy(PaymentClient, "WebhookBody", {
      signature,
      body: parsedBody,
      raw_body: rawBody,
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



router.post("/cashfree", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = (req.headers["x-webhook-signature"] as string) || "";
    const timestamp = (req.headers["x-webhook-timestamp"] as string) || "";
    let rawBody: string;

    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString();
    } else if (typeof req.body === "string") {
      rawBody = req.body;
    } else {
      rawBody = JSON.stringify(req.body);
    }

    const result = await callWithPolicy(PaymentClient, "WebhookBody", {
      signature,
      raw_body: rawBody,
      provider: "CASHFREE",
      timestamp,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(
      AppError.Webhook(
        error instanceof Error ? error.message : "Cashfree webhook processing failed",
      ),
    );
  }
});

export default router;
