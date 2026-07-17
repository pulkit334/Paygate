import { Request, Response } from "express";
import { GatewayType } from "../types/GatewayTypes";
import Transaction from "../models/transction";
import { PaymentData } from "../types/PaymentTypes";
import { GatewayFactory } from "../Engine/PaymentEngine";
import crypto from "crypto";
import RazerPayService from "../Engine/key/provider";
import mongoose from "mongoose";

export class PaymentService {
  static async initiatePayment(PaymentData: any, appId: string) {
    const {
      amount,
      currency,
      metadata,
      idempotencyKey,
      customerName,
      customerEmail,
      Provider,
      callbackUrl,
    } = PaymentData;

    try {
      let resolvedCallbackUrl = callbackUrl || "";
      if (!resolvedCallbackUrl) {
        try {
          const appDoc = await mongoose.connection.db?.collection("apps").findOne(
            { _id: new mongoose.Types.ObjectId(appId) },
            { projection: { callbackUrl: 1 } }
          );
          resolvedCallbackUrl = (appDoc as any)?.callbackUrl || "";
        } catch {}
      }

      let newTransaction;
      try {
        newTransaction = await Transaction.create({
          appId,
          amount,
          currency: currency || "INR",
          customerEmail,
          customerName,
          metadata,
          idempotencyKey,
          Provider,
          callbackUrl: resolvedCallbackUrl,
          status: "created",
        });
      } catch (err: any) {
        if (err.code === 11000) {
          return await Transaction.findOne({ idempotencyKey });
        }
        throw err;
      }

      const targetGateway = Provider
        ? (Provider.toUpperCase() as GatewayType)
        : GatewayType.RAZORPAY;
      const factory = GatewayFactory.getInstance();
      const paymentEngine = factory.getGateway(targetGateway, appId);
      const paymentPayload: PaymentData = {
        amount: amount,
        currency: newTransaction.currency as string,
        receipt: newTransaction._id.toString(),
      };
      const gatewayResponse =
        await paymentEngine.processPayment(paymentPayload, appId);

      newTransaction.razorpayOrderId = gatewayResponse.orderId;
      await newTransaction.save();

      // Fetch the merchant's Razorpay key_id for frontend checkout
      let razorkey: string;
      try {
        razorkey = await RazerPayService.getKeyId(appId);
      } catch {
        razorkey = process.env.RAZORPAY_KEY_ID || "";
      }

      return {
        transactionId: newTransaction._id,
        providerOrderId: gatewayResponse.orderId,
        amount: newTransaction.amount,
        currency: newTransaction.currency,
        providerUsed: targetGateway,
        razorkey,
      };
    } catch (error: any) {
      throw new Error(`Service Failure: ${error.message}`);
    }
  }

  static async VerifyPayment(verificationData: any, appId: string) {
    const razorpay_order_id = verificationData.razorpay_order_id || verificationData.razorpayOrderId;
    const razorpay_payment_id = verificationData.razorpay_payment_id || verificationData.razorpayPaymentId;
    const razorpay_signature = verificationData.razorpay_signature || verificationData.razorpaySignature;

    const transaction = await Transaction.findOne({
      razorpayOrderId: razorpay_order_id,
      appId,
    });
    if (!transaction) {
      return { success: false, message: "Transaction not found" };
    }

    const keySecret = await RazerPayService.GetKeySecret(appId);
    const GeneratedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    if (GeneratedSignature !== razorpay_signature) {
      return { success: false, status: "failed", message: "Invalid signature: payment signature verification failed" };
    }

    if ((transaction.status as string) === "paid") {
      return {
        success: true,
        status: "paid",
        message: "Payment verified and Ledger is already updated.",
      };
    }

    transaction.razorpayPayId = razorpay_payment_id;
    await transaction.save();

    return {
      success: true,
      status: "processing",
      message: "Signature verified securely. Safe to show success screen.",
    };
  }
}
