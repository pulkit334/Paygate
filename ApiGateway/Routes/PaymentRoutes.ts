import express, { Request, Response } from "express";
import { merchantClient, PaymentClient } from "../GrpcRef/Grpc";
import { ApiKeyMiddleware } from "../Middleware/validation_middlware";
const router = express.Router();

router.post(
  "/create",
  ApiKeyMiddleware,
  async (req: Request, res: Response) => {
        console.log("req.app:", (req as any).app); // ADD THIS

    const Grpcpayload = {
      appId: (req as any).app._id, // ← now available
      amount: req.body.amount,
      currency: req.body.currency,
      customerName: req.body.customerName,
      metadata: req.body.metadata || "",
      idempotencyKey: req.body.idempotencyKey,
      customoreEmail: req.body.customoreEmail,
      Provider: req.body.Provider,
    };

    console.log("gRPC payload:", Grpcpayload);
    PaymentClient.CreateOrder(Grpcpayload, (err: any, Response: any) => {
      if (err) {
        return res.status(400).json({
          success: false,
          err: err.message,
        });
      }
      res.status(200).json(Response);
    });
  },
);
router.post("/verify", async (req: Request, res: Response) => {
  const GrpcPayLoad = {
    razorpay_order_id: req.body.razorpay_order_id,
    razorpay_payment_id: req.body.razorpay_payment_id,
    razorpay_signature: req.body.razorpay_signature,
  };

  PaymentClient.Verify(GrpcPayLoad, (err: any, Response: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        err: err.message,
      });
    }
    res.status(200).json(Response);
  });
});
export default router;
