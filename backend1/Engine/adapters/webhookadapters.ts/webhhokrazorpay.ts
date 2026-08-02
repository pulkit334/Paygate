import crypto from "crypto";
import {
  INormalizedWebhookEvent,
  IWebhookAdapter,
} from "../../../Interfaces/webhookadapterss";

export class RazorpayWebhookAdapter implements IWebhookAdapter {
  verifySignature(rawBody: string, signature: string): boolean {
    const expected = crypto
      .createHmac("sha256", process.env.WEBHOOK_SIGNING_SECRET as string)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  normalize(rawBody: string): INormalizedWebhookEvent {
    const data = JSON.parse(rawBody);
    const entity = data?.payload?.payment?.entity ?? {};
    return {
      provider: "RAZORPAY",
      captured: data.event === "payment.captured",
      gatewayOrderId: String(entity.order_id ?? ""),
      gatewayPayId: String(entity.id ?? ""),
      amountPaise: Number(entity.amount ?? 0) / 100,
      currency: String(entity.currency ?? "INR"),
    };
  }
};