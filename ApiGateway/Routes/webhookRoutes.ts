import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc.js";
import AppError from "../utils/Error.js";

const router = express.Router();

router.post("/razorpay", async (req: Request, res: Response, next) => {
  try {
    console.debug("the sigraito is ",req.headers);
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
