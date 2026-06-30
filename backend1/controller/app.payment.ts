import * as z from "zod";
import { CreateOrderSchema } from "../schema/app.payment_schema";
// import dotenv from 'dotenv';

import { PaymentService } from "../services/app.PaymentService";
import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";
import Transaction from "../models/transction";

export const createOrder = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  
  console.log("the data inside the createOrder will be ", call.request);
  const result = CreateOrderSchema.safeParse(call.request);
  if (!result.success) {
    const error = z.flattenError(result.error).fieldErrors;
    return callback({
      code: status.INVALID_ARGUMENT,
      message: `Validation Failed: ${JSON.stringify(error)}`,
    });
  }

  const appId = call.request.appId;

  try {
    const PaymentResponse = await PaymentService.initiatePayment(
      result.data as any,
      appId,
    );

    console.log(PaymentResponse);

    if (!PaymentResponse) {
      return callback({
        code: status.NOT_FOUND,
        message: "Payment could not be initiated",
      });
    }
    const response = PaymentResponse as any;
    console.log("Sending response:", {
      success: true,
      orderId: response.providerOrderId,
      amount: response.amount,
      currency: response.currency,
      status: "created",
      createdAt: new Date().toISOString(),
      error: "",
    });

    return callback(null, {
      success: true,
      orderId: response.providerOrderId,
      amount: response.amount,
      currency: response.currency,
      status: "created",
      createdAt: new Date().toISOString(),
      error: "",
    });
  } catch (error: any) {
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal Server Error",
    });
  }
};

export const VerifyOrder = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const appId = call.request.app._id;

    const result = await PaymentService.VerifyPayment(call.request, appId);

    if (!result) {
      return callback({
        code: status.NOT_FOUND,
        message: "Payment verification failed",
      });
    }

    return callback(null, {
      success: true,
      status: "verified",
      message: "Signature verified securely. Safe to show success screen.",
      error: "",
    });
  } catch (error: any) {
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal Server Error",
    });
  }
};

export const GetTransction = async (call: ServerUnaryCall<any, any>, callback: sendUnaryData<any>) => {
  const appId = call.request.appId;
  const { from, to, limit = 50, offset = 0 } = call.request;

  try {
    const query: any = { appId };

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to + "T23:59:59.999Z");
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    return callback(null, {
      success: true,
      transactions: transactions.map((t) => ({
        transactionId: t._id.toString(),
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        customerEmail: t.customerEmail,
        customerName: t.customerName,
        razorpayOrderId: t.razorpayOrderId,
        razorpayPayId: t.razorpayPayId || "",
        provider: t.Provider || "",
        createdAt: t.createdAt?.toISOString() || "",
      })),
      total,
    });
  } catch (error: any) {
    return callback({
      code: status.INTERNAL,
      message: error.message || "Failed to fetch transactions",
    });
  }
};
