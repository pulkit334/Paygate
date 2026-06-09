import * as z from "zod";
import { Request, Response } from "express";
import { CreateOrderSchema } from "../schema/app.payment_schema";
// import dotenv from 'dotenv';

import { PaymentService } from "../services/app.PaymentService";
import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";

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

  const appId = call.request.appId; // from proto request, not req

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
// STEP 1: Validate the incoming request body using the Zod 4 schema.
// Check for: amount (int), currency (enum), customerName, and idempotencyKey.

// STEP 2: Handle validation failures.
// If result.success is false, return a 422 error with field-level details.

// STEP 3: Identify the calling Application/Merchant.
// Extract the App ID from the request object (attached by your API Key Middleware).

// STEP 4: Implement Idempotency - The "Database-First" Write.
// Attempt to create a new record in the Transactions collection.
// Use the idempotencyKey from the request as a unique identifier.

// STEP 5: Database Guard - Handle duplicate requests.
// If the DB throws an 11000 error, it means the merchant clicked "Pay" twice.
// Catch this, fetch the existing transaction, and return it to prevent double-charging.

// STEP 6: Prepare for the External Provider (Razorpay).
// Convert the amount to the smallest unit (e.g., multiply by 100 for INR/Paise).
// Initialize the Razorpay Strategy from your Gateway Factory.

// STEP 7: Initiate the Payment with Razorpay.
// Call the Razorpay SDK to create an order.
// Pass your MongoDB _id as the 'receipt' to link the two systems.

// STEP 8: Persist the Provider's Order ID.
// Save the generated 'razorpay_order_id' back to your local Transaction record.
// Set the transaction status to 'created'.

// STEP 9: Final Response.
// Return a 201 Created status with the transactionId and razorpayOrderId.
// The merchant app will use this to trigger the frontend checkout.

// STEP 10: Global Error Catch.
// Handle SDK failures or network issues with a 500 Internal Server Error.
