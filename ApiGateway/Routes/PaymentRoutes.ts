import express, { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { merchantClient, PaymentClient } from "../GrpcRef/Grpc.js";
import { ApiKeyMiddleware } from "../Middleware/validate_APi_Key.js";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth.js";
import AppError from "../utils/Error.js";
import { callWithPolicy } from "../GrpcRef/paymentGrpcclient.js";

const router = express.Router();

router.post(
  "/create",
  ApiKeyMiddleware,
  async (req: Request, res: Response, next) => {
    try {
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
        metadata:
          typeof req.body.metadata === "object"
            ? JSON.stringify(req.body.metadata)
            : req.body.metadata || "",
        idempotencyKey: req.body.idempotencyKey || crypto.randomUUID(),
        customoreEmail: req.body.customerEmail || req.body.customoreEmail || "",
        Provider: req.body.Provider || "razorpay",
        callbackUrl: req.body.callbackUrl || "",
      };

      const Response = await callWithPolicy(PaymentClient, "CreateOrder", Grpcpayload);
      res.status(200).json(Response);
    } catch (error: any) {
      next(error instanceof AppError ? error : AppError.Payment(error.message));
    }
  },
);

router.post(
  "/verify",
  ApiKeyMiddleware,
  async (req: Request, res: Response, next) => {
    try {
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
        appId: (req as any).app._id,
        razorpay_order_id: req.body.razorpay_order_id,
        razorpay_payment_id: req.body.razorpay_payment_id,
        razorpay_signature: req.body.razorpay_signature,
      };

      const Response = await callWithPolicy(PaymentClient, "VerifyOrder", GrpcPayLoad);
      res.status(200).json(Response);
    } catch (error: any) {
      next(error instanceof AppError ? error : AppError.Payment(error.message));
    }
  },
);

router.get(
  "/transactions",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;

      if (!appId) throw AppError.Validation("Unauthorized");

      const { from, to, limit = "50", offset = "0" } = req.query;

      const grpcPayload = {
        appId,
        from: from || "",
        to: to || "",
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      };

      const Response = await callWithPolicy(PaymentClient, "GetTransctions", grpcPayload);
      res.status(200).json(Response);
    } catch (error: any) {
      next(error instanceof AppError ? error : AppError.Payment(error.message));
    }
  },
);

router.get(
  "/ledger",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const Response = await callWithPolicy(PaymentClient, "GetLedger", { appId });
      res.status(200).json(Response);
    } catch (err: any) {
      next(err instanceof AppError ? err : AppError.Payment(err.message));
    }
  },
);

export default router;
