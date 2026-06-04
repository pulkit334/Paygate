import razorpay from "../../config/razerpay";
import { PaymentData, PaymentResponse } from "../../types/PaymentTypes";
import { BaseTemplate } from "../BaseTemplate";

export class RazerPayProvider extends BaseTemplate {
    constructor() {
    super();
  }

  protected async validate(data: PaymentData): Promise<void> {
    if (!data.amount || data.amount <= 0) {
      throw new Error("[Razorpay] Invalid amount provided.");
    }
    if (!data.currency) {
      throw new Error("[Razorpay] Currency is required.");
    }
    if (!data.receipt) {
      throw new Error("[Razorpay] Receipt ID is required.");
    }
  }

  protected async initiate(data: PaymentData): Promise<Record<string, unknown>> {
    try {
      const order = await razorpay.orders.create({

        amount: data.amount * 100, 
        currency: data.currency,
        receipt: data.receipt,
      });
      return order as unknown as Record<string, unknown>;
    } catch (error: any) {
      throw new Error(`[Razorpay] Failed to initiate order: ${error.message || error}`);
    }
  }

  protected async confirm(order: Record<string, unknown>): Promise<PaymentResponse> {
    return {
      orderId: String(order.id),
      amount: Number(order.amount) / 100, 
      currency: String(order.currency),
      status: String(order.status),
    };
  }
}