import crypto from "crypto";
import mongoose from "mongoose";
import Transaction from "../models/transction";
import TransactionLedger from "../models/ledgerentry";
import Balance from "../models/balance";
import { redisClient } from "../config/redis";
import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";




const payWebhook = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    // 1. Verify HMAC signature
    const signature = call.request.signature as string;
    const rawBody = call.request.raw_body as string;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.WEBHOOK_SIGNING_SECRET as string)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("Razorpay webhook: invalid signature");
      return callback({
        code: status.UNAUTHENTICATED,
        message: "Invalid signature",
      });
    }

    // 2. Parse raw body for event and payment details
    const webhookData = JSON.parse(rawBody);
    const event = webhookData.event;

    if (event !== "payment.captured") {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "Unauthorized event type",
      });
    }

    // 3. Extract payment details
    const razorpayOrderId: string = webhookData.payload.payment.entity.order_id;
    const razorpayPayId: string = webhookData.payload.payment.entity.id;
    const amountPaise: number = webhookData.payload.payment.entity.amount;
    const currency: string = webhookData.payload.payment.entity.currency;

    const existingTxn = await Transaction.findOne({ razorpayOrderId });
    
    if (!existingTxn) {
      throw new Error(`Transaction not found for orderId: ${razorpayOrderId}`);
    }
    
    if (existingTxn.amount !== amountPaise) {
      throw new Error(`Amount mismatch. Expected ${existingTxn.amount}, got ${amountPaise}`);
    }

    // IDEMPOTENCY: If already marked paid, return success instantly without doing duplicate work
    if (existingTxn.status === "paid") {
      return callback(null, {
        success: true,
        message: "Webhook already processed (Idempotent call)",
        error: "",
      });
    }

    let appId: string = existingTxn.appId.toString();
    let callbackUrl: string = existingTxn.callbackUrl ?? "";

    // 5. Transactional DB writes
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
       //secure  row lockl
        const txn = await Transaction.findOne({ razorpayOrderId }).session(session);
        if (!txn || txn.status === "paid") return; // Safety check if parallel threads compete

        // 5a. Atomically increment balance (no race condition)
        const updated = await Balance.findOneAndUpdate(
          { appId: txn.appId },
          { $inc: { amount: amountPaise } },
          { upsert: true, new: true, session }
        );
        const balanceAfter = updated.amount;
        const balanceBefore = balanceAfter - amountPaise;

        // 5b. Update transaction object status
        txn.status = "paid";
        txn.razorpayPayId = razorpayPayId;
        txn.paidAt = new Date();
        await txn.save({ session });

        // 5c. Create ledger entry
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

        // 5d. Push to Redis Stream for async balance updates (no race condition)
        await redisClient.xadd(
          "AccountSummaryUpdate",
          "*",
          "appId", appId,
          "totalReceived", amountPaise.toString(),
          "totalTransactions", "1",
          "successCount", "1",    
        );
      });
    } finally {
      await session.endSession();
    }

    // 6. Push event notice to secondary processing stream (Non-blocking background workflow)
    redisClient
      .xadd(
        "payment.stream",
        "*",
        "appId", appId,
        "orderId", razorpayOrderId,
        "payId", razorpayPayId,
        "amount", amountPaise.toString(),
        "currency", currency,
        "callbackUrl", callbackUrl,
      )
      .catch((err) => console.error("Redis payment.stream write failed:", err.message));

    // gRPC final success callback acknowledgment response
    return callback(null, {
      success: true,
      message: "Webhook received and processed successfully",
      error: "",
    });

  } catch (error: any) {
    console.error("Razorpay webhook processing error:", error?.message ?? error);
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal server error",
    });
  }
};

export default payWebhook;
