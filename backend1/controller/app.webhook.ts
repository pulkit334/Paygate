import { Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import Transaction from "../models/transction";
import TransactionLedger from "../models/ledgerentry";
// import AC from "../models/accountsummary";
// import App from "../models/app";
import { redisClient } from "../config/redis";
import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";

const payWebhook = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    // 1. Verify HMAC signature
    const signature = call.request.signature as string;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET as string)
      .update(JSON.stringify(call.request.body))
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("Razorpay webhook: invalid signature");
      return callback({
        code: status.UNAUTHENTICATED,
        message: "Invalid signature",
      });
    }

    // 2. Only handle payment.captured
    const event = call.request.body.event;
    if (event !== "payment.captured") {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "Unauthorized event type",
      });
    }

    // 3. Extract payment details
    const razorpayOrderId: string =
      call.request.body.payload.payment.entity.order_id;
    const razorpayPayId: string = call.request.body.payload.payment.entity.id;
    const amountPaise: number = call.request.body.payload.payment.entity.amount;
    const currency: string = call.request.body.payload.payment.entity.currency;

    // 4. Transactional DB writes
    let appId: string = "";
    let callbackUrl: string = "";

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // 4a. Find transaction
        const txn = await Transaction.findOne({ razorpayOrderId }).session(
          session,
        );

        if (!txn) {
          throw new Error(
            `Transaction not found for orderId: ${razorpayOrderId}`,
          );
        }

        // 4b. Idempotency
        if (txn.status === "paid") {
          return;
        }

        appId = txn.appId.toString();
        callbackUrl = txn.callbackUrl ?? "";

        // 4c. Read Balance Before
        const AccountLedger = await TransactionLedger.findOne({
          appId: txn.appId,
        }).session(session);
        const balanceBefore = AccountLedger?.balanceBefore ?? 0;
        const balanceAfter = Number(balanceBefore) + amountPaise;

        // 4d. Mark transaction paid
        txn.status = "paid";
        txn.razorpayPayId = razorpayPayId;
        txn.paidAt = new Date();
        await txn.save({ session });

        // 4e. Create ledger entry
        await TransactionLedger.create(
          [
            {
              appId: txn.appId,
              transactionId: txn._id.toString(),
              amount: amountPaise,
              balanceBefore,
              balanceAfter,
              description: `Payment captured — order ${razorpayOrderId}`,
            },
          ],
          { session },
        );

        // 4f. Account summary via Redis stream
        await redisClient.xadd(
          "AccountSummaryUpdate",
          "*",
          "appId",
          appId,
          "totalReceived",
          amountPaise,
          "totalTransactions",
          1,
          "successCount",
          1,
        );
      });
    } finally {
      await session.endSession();
    }

    // 5. Push to payment stream
    await redisClient.xadd(
      "payment.stream",
      "*",
      "appId",
      appId,
      "orderId",
      razorpayOrderId,
      "payId",
      razorpayPayId,
      "amount",
      amountPaise.toString(),
      "currency",
      currency,
      "callbackUrl",
      callbackUrl,
    );

    //  gRPC success response
    return callback(null, {
      success: true,
      message: "Webhook received and processed",
      error: "",
    });
  } catch (error: any) {
    console.error(
      "Razorpay webhook processing error:",
      error?.message ?? error,
    );

    // gRPC error response
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal server error",
    });
  }
};

export default payWebhook;
