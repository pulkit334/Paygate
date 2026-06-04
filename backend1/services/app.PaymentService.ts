import { Request, Response } from "express";
import { GatewayType } from "../types/GatewayTypes";
import Transaction from "../models/transction";
import { PaymentData } from "../types/PaymentTypes";
import { GatewayFactory } from "../Engine/PaymentEngine";
import crypto from "crypto";
export class PaymentService {
  static async initiatePayment(PaymentData: any, appId: string) {
    console.log("the data for the class would be ", PaymentData);
    const {
      amount,
      currency,
      metadata,
      idempotencyKey,
      customerName,
      customoreEmail,
      Provider,
    } = PaymentData;

    try {
      let newTransaction;
      try {
        newTransaction = await Transaction.create({
          appId,
          amount,
          currency: currency || "INR",
          customerEmail: customoreEmail,
          customerName,
          metadata,
          idempotencyKey,
          Provider,
          status: "created",
        });
      } catch (err: any) {
        if (err.code === 11000) {
          console.log("DUPLICATE KEY  ERROR:", err.message);

          return await Transaction.findOne({ idempotencyKey });
        }
        throw err;
      }

      const targetGateway = Provider
        ? (Provider as GatewayType)
        : GatewayType.RAZORPAY;
      const factory = GatewayFactory.getInstance();
      const paymentEngine = factory.getGateway(targetGateway);
      const paymentPayload: PaymentData = {
        amount: amount * 100,
        currency: newTransaction.currency as string,
        receipt: newTransaction._id.toString(),
      };
      console.log("the gatway Response would be ", paymentPayload);
      const gatewayResponse =
        await paymentEngine.processPayment(paymentPayload);

      newTransaction.razorpayOrderId = gatewayResponse.orderId;
      await newTransaction.save();
      console.log("the order id strureo would be ", gatewayResponse);
      return {
        transactionId: newTransaction._id,
        providerOrderId: gatewayResponse.orderId,
        amount: newTransaction.amount,
        currency: newTransaction.currency,
        providerUsed: targetGateway,
      };
    } catch (error: any) {
      // FORCE THE ERROR TO SHOW IN TERMINAL
      console.error("==== RAZORPAY CRASH ====");
      console.error(error);

      // THROW IT UP TO THE CONTROLLER
      throw new Error(`Service Failure: ${error.message}`);
    }
  }

  static async VerifyPayment(VerficationData: any, appId: string) {
    // first take the order Id
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      VerficationData;

    const transaction = await Transaction.findOne({
      razorpayOrderId: razorpay_order_id,
      appId,
    });
    if (!transaction) {
      return { success: false, message: "Transaction not found" };
    }

    const GeneratedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    if (GeneratedSignature !== razorpay_signature) {
      throw new Error("Fraud detected: Invalid signature");
    }

    if ((transaction.status as string) === "Paid") {
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
