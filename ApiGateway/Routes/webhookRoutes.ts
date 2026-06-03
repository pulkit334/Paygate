import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc";
const router = express.Router();

router.post("/webhook/razorpay", async (req: Request, res: Response) => {
  try {
    const result = await PaymentClient.payWebhook({
      signature: req.headers["x-razorpay-signature"],
      body: req.body,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Webhook failed" });
  }
});
