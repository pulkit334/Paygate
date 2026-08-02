import { IWebhookAdapter } from "../../Interfaces/webhookadapterss";
import { RazorpayWebhookAdapter } from "../../Engine/adapters/webhookadapters.ts/webhhokrazorpay";
import { CashfreeWebhookAdapter } from "../adapters/webhookadapters.ts/webhhokcashfree";

export class WebhookFactory {
  static get(Provider: string): IWebhookAdapter {
    switch (Provider.toUpperCase()) {
      case "RAZORPAY":
        return new RazorpayWebhookAdapter();
      case "CASHFREE":
        return new CashfreeWebhookAdapter();

      default:
        throw new Error(`[WebhookFactory] Unsupported provider: ${Provider}`);
    }
  }
}
