import { Request, Response } from "express";
import { GatewayType } from "../types/GatewayTypes";
import Transaction from "../models/transction";
import { GatewayFactory } from "../Engine/PaymentEngine";
import { normalizeToCPaymentData } from "../util/normalizePaymentData";
import crypto from "crypto";
import RazerPayService from "../Engine/key/provider";
import mongoose from "mongoose";
import GatewayCredentialService from "../Engine/key/provider";
import { VerifyAdapterFactory } from "../Engine/VerifyEngine";

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
          const appDoc = await mongoose.connection.db
            ?.collection("apps")
            .findOne(
              { _id: new mongoose.Types.ObjectId(appId) },
              { projection: { callbackUrl: 1 } },
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
        : GatewayType.CASHFREE;

      console.log(
        "[PaymentService] Received Provider field:",
        PaymentData.Provider,
      );
      console.log("[PaymentService] Resolved targetGateway:", targetGateway);
      const factory = GatewayFactory.getInstance();
      const paymentEngine = factory.getGateway(targetGateway, appId);
      const paymentPayload = normalizeToCPaymentData({
        amount,
        currency: newTransaction.currency as string,
        receipt: newTransaction._id.toString(),
        customerEmail: customerEmail || "",
      });
      const gatewayResponse = await paymentEngine.processPayment(
        paymentPayload,
        appId,
      );

      newTransaction.GatewayOrderId = gatewayResponse.orderId;
      await newTransaction.save();

      let razorkey: Record<string, string> | undefined;
      if (targetGateway === GatewayType.RAZORPAY) {
        razorkey = await GatewayCredentialService.GetInstance(appId, "razorpay");
      }

      return {
        transactionId: newTransaction._id,
        providerOrderId: gatewayResponse.orderId,
        amount: newTransaction.amount,
        currency: newTransaction.currency,
        providerUsed: targetGateway,
        ...(razorkey && { razorkey }),
        paymentSessionId: gatewayResponse.paymentSessionId || "",
      };
    } catch (error: any) {
      throw new Error(`Service Failure: ${error.message}`);
    }
  }

static async VerifyPayment(verificationData: any, appId: string) {
  const orderId =
    verificationData.razorpay_order_id ||
    verificationData.razorpayOrderId ||
    verificationData.order_id;

  const transaction = await Transaction.findOne({ GatewayOrderId: orderId, appId });
if (!transaction) {
  return { success: false, status: "failed", message: "Transaction not found" };
}

  const adapter = VerifyAdapterFactory.get(transaction.Provider as string);
  return adapter.verify(verificationData, appId, transaction);
}
}
