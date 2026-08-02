import crypto from "crypto";
import { IVerifyAdapters, IVerifyResult } from "../../../Interfaces/VerifyAdapters";
import { getRazorpayCredentials } from "../../../config/providerconfig";


export class RazorpayVerifyAdapter implements IVerifyAdapters {
  async verify(data: any, appId: string, transaction: any): Promise<IVerifyResult> {
    const razorpay_order_id = data.razorpay_order_id || data.razorpayOrderId;
    const razorpay_payment_id = data.razorpay_payment_id || data.razorpayPaymentId;
    const razorpay_signature = data.razorpay_signature || data.razorpaySignature;

    const credentials = await getRazorpayCredentials(appId);
    const key_secret = credentials.key_secret;
    const GeneratedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (GeneratedSignature !== razorpay_signature) {
      return {
        success: false,
        status: "failed",
        message: "Invalid signature: payment signature verification failed",
      };
    }

    if (transaction.status === "paid") {
      return {
        success: true,
        status: "paid",
        message: "Payment verified and Ledger is already updated.",
      };
    }

    transaction.GatewayPayId = razorpay_payment_id;
    await transaction.save();

    return {
      success: true,
      status: "processing",
      message: "Signature verified securely. Safe to show success screen.",
    };
  }
}