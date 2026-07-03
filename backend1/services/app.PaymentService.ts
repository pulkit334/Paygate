import { Request, Response } from "express";
import { GatewayType } from "../types/GatewayTypes";
import Transaction from "../models/transction";
import { PaymentData } from "../types/PaymentTypes";
import { GatewayFactory } from "../Engine/PaymentEngine";
import crypto from "crypto";
import RazerPayService from "../Engine/key/provider";

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
    } = PaymentData;

    try {
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
          status: "created",
        });
      } catch (err: any) {
        if (err.code === 11000) {
          return await Transaction.findOne({ idempotencyKey });
        }
        throw err;
      }

      const targetGateway = Provider
        ? (Provider as GatewayType)
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
      return {
        transactionId: newTransaction._id,
        providerOrderId: gatewayResponse.orderId,
        amount: newTransaction.amount,
        currency: newTransaction.currency,
        providerUsed: targetGateway,
      };
    } catch (error: any) {
      throw new Error(`Service Failure: ${error.message}`);
    }
  }

  static async VerifyPayment(verificationData: any, appId: string) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      verificationData;

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
      throw new Error("Fraud detected: Invalid signature");
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
