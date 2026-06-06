import express, { Request, Response } from "express";
import { merchantClient, PaymentClient } from "../GrpcRef/Grpc";
import { ApiKeyMiddleware } from "../Middleware/validate_APi_Key";
import AppError from "../utils/Error"; 

const router = express.Router();

router.post(
  "/create",
  ApiKeyMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      // ← ADD VALIDATION
      if (!req.body.amount) {
        throw AppError.Validation("Amount is required");
      }
      if (req.body.amount < 1) {
        throw AppError.Validation("Amount must be greater than 0");
      }
      if (!req.body.currency) {
        throw AppError.Validation("Currency is required");
      }

      const Grpcpayload = {
        appId: (req as any).app._id,
        amount: req.body.amount,
        currency: req.body.currency,
        customerName: req.body.customerName,
        metadata: req.body.metadata || "",
        idempotencyKey: req.body.idempotencyKey,
        customoreEmail: req.body.customoreEmail,
        Provider: req.body.Provider,
      };

      console.log("gRPC payload:", Grpcpayload);
      
      // ← USE AppError.Payment()
      PaymentClient.CreateOrder(Grpcpayload, (err: any, Response: any) => {
        if (err) {
          return next(AppError.Payment(err.message));
        }
        res.status(200).json(Response);
      });
    } catch (error) {
      next(error); // ← PASS TO GLOBAL HANDLER
    }
  }
);

router.post("/verify", async (req: Request, res: Response, next) => {
  try {
    // ← ADD VALIDATION
    if (!req.body.razorpay_order_id) {
      throw AppError.Validation("razorpay_order_id is required");
    }
    if (!req.body.razorpay_payment_id) {
      throw AppError.Validation("razorpay_payment_id is required");
    }
    if (!req.body.razorpay_signature) {
      throw AppError.Validation("razorpay_signature is required");
    }

    const GrpcPayLoad = {
      razorpay_order_id: req.body.razorpay_order_id,
      razorpay_payment_id: req.body.razorpay_payment_id,
      razorpay_signature: req.body.razorpay_signature,
    };

   
    PaymentClient.Verify(GrpcPayLoad, (err: any, Response: any) => {
      if (err) {
        return next(AppError.Payment(err.message));
      }
      res.status(200).json(Response);
    });
  } catch (error) {
    next(error); // ← PASS TO GLOBAL HANDLER
  }
});

export default router;