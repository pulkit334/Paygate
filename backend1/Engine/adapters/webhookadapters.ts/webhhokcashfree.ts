import {
  INormalizedWebhookEvent,
  IWebhookAdapter,
} from "../../../Interfaces/webhookadapterss";
import crypto from "crypto";

export class CashfreeWebhookAdapter implements IWebhookAdapter {
  verifySignature(
    rawBody: string,
    signature: string,
    timestamp?: string,
  ): boolean {
    const secret = process.env.CASHFREE_WEBHOOK_SECRET as string;
    const expected = crypto.createHmac("sha256", secret).update((timestamp ?? "") + rawBody).digest("base64");
    return expected === signature;
  }

  normalize(rawBody: string): INormalizedWebhookEvent {
    const Data = JSON.parse(rawBody);
    const order = Data?.data?.order ?? {};
    const payment = Data?.data?.payment ?? {};

    return {
      provider: "CASHFREE",
      captured: Data.type === "PAYMENT_SUCCESS_WEBHOOK",
      gatewayOrderId: String(order.order_id ?? ""),
      gatewayPayId: String(payment.cf_payment_id ?? ""),
      amountPaise: Number(payment.payment_amount ?? 0),
      currency: String(payment.payment_currency ?? "INR"),
    };
  }
}