import mongoose from "mongoose";
import Transaction from "../models/transction";
import TransactionLedger from "../models/ledgerentry";
import Balance from "../models/balance";
import { redisClient } from "../config/redis";
import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";
import { WebhookFactory } from "../Engine/Factory/webhookfactory";


const payWebhook = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { signature, raw_body: rawBody, provider = "RAZORPAY", timestamp } = call.request;

    const adapter = WebhookFactory.get(provider);
    if (!adapter.verifySignature(rawBody, signature, timestamp)) {
      console.warn("Provider webhook: invalid signature");
      return callback({ code: status.UNAUTHENTICATED, message: "Invalid signature" });
    }

    const evt = adapter.normalize(rawBody);
    if (!evt.captured) {
      return callback({ code: status.INVALID_ARGUMENT, message: "Unauthorized event type" });
    }

    const existingTxn = await Transaction.findOne({ GatewayOrderId: evt.gatewayOrderId });

    if (!existingTxn) {
      throw new Error(`Transaction not found for orderId: ${evt.gatewayOrderId}`);
    }

    if (existingTxn.amount !== evt.amountPaise) {
      throw new Error(`Amount mismatch. Expected ${existingTxn.amount}, got ${evt.amountPaise}`);
    }

    if (existingTxn.status === "paid") {
      return callback(null, {
        success: true,
        message: "Webhook already processed (Idempotent call)",
        error: "",
      });
    }

    let appId: string = existingTxn.appId.toString();
    let callbackUrl: string = existingTxn.callbackUrl ?? "";

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const txn = await Transaction.findOne({ GatewayOrderId: evt.gatewayOrderId }).session(session);
        if (!txn || txn.status === "paid") return;

        const updated = await Balance.findOneAndUpdate(
          { appId: txn.appId },
          { $inc: { amount: evt.amountPaise } },
          { upsert: true, new: true, session }
        );
        const balanceAfter = updated.amount;
        const balanceBefore = balanceAfter - evt.amountPaise;

        txn.status = "paid";
        txn.GatewayPayId = evt.gatewayPayId;
        txn.paidAt = new Date();
        await txn.save({ session });

        await TransactionLedger.create(
          [
            {
              appId: txn.appId,
              transactionId: txn._id.toString(),
              amount: evt.amountPaise,
              balanceBefore,
              balanceAfter,
              description: `Payment captured — order ${evt.gatewayOrderId}`,
            },
          ],
          { session },
        );

        await redisClient.xadd(
          "AccountSummaryUpdate",
          "*",
          "appId", appId,
          "totalReceived", evt.amountPaise.toString(),
          "totalTransactions", "1",
          "successCount", "1",
        );
      });
    } finally {
      await session.endSession();
    }

    redisClient
      .xadd(
        "payment.stream",
        "*",
        "appId", appId,
        "orderId", evt.gatewayOrderId,
        "payId", evt.gatewayPayId,
        "amount", evt.amountPaise.toString(),
        "currency", evt.currency,
        "callbackUrl", callbackUrl,
      )
      .catch((err) => console.error("Redis payment.stream write failed:", err.message));

    return callback(null, {
      success: true,
      message: "Webhook received and processed successfully",
      error: "",
    });

  } catch (error: any) {
    console.error("Webhook processing error:", error?.message ?? error);
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal server error",
    });
  }
};

export default payWebhook;