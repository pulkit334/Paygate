import instance from "../../config/providerconfig";
import { IPaymentResponse } from "../../Interfaces/PaymentAdapters";
import { CPaymentData } from "../../Interfaces/paymentgateway";

import { BaseTemplate } from "../BaseTemplate";
import { RazorpayAdapter } from "../adapters/Razerpayadapter";
export class RazerPayProvider extends BaseTemplate {
  private appId: string;
  constructor(
    appId: string,
    private adapter: RazorpayAdapter,
  ) {
    super();
    this.appId = appId;
  }

  protected async validate(data: CPaymentData): Promise<void> {
    if (!data.order_amount || data.order_amount <= 0) {
      throw new Error("[Razorpay] Invalid amount provided.");
    }
    if (!data.order_currency) {
      throw new Error("[Razorpay] Currency is required.");
    }
    if (!data.order_id) {
      throw new Error("[Razorpay] Receipt ID is required.");
    }
  }

  protected async initiate(
    data: CPaymentData,
  ): Promise<Record<string, unknown>> {
    try {
      const razorpay = await instance(this.appId);
      const order = await razorpay.orders.create({
        amount: data.order_amount * 100,
        currency: data.order_currency,
        receipt: data.order_id,
      });
      return order as unknown as Record<string, unknown>;
    } catch (error: any) {
      throw new Error(
        `[Razorpay] Failed to initiate order: ${error.message || error}`,
      );
    }
  }

  protected async confirm(
    order: Record<string, unknown>,
  ): Promise<IPaymentResponse> {
    return this.adapter.normalize(order);
  }
}
