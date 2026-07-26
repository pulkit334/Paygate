import { OrderEntity } from "cashfree-pg";
import { cashfreeinstance } from "../../config/providerconfig";
import { CPaymentData } from "../../Interfaces/paymentgateway";
import { BaseTemplate } from "../BaseTemplate";
import { IPaymentResponse } from "../../Interfaces/PaymentAdapters";
import { CashfreeAdapter } from "../adapters/cashfreeadapter";

export class CashfreeProvider extends BaseTemplate {
  private appId: string;

  constructor(
    appId: string,
    private adapter: CashfreeAdapter,
  ) {
    super();
    this.appId = appId;
  }

  protected async validate(data: CPaymentData): Promise<void> {
    if (!data.order_amount || data.order_amount <= 0) {
      throw new Error("[Cashfree] Invalid amount provided.");
    }
    if (!data.order_currency) {
      throw new Error("[Cashfree] Currency is required.");
    }
    if (!data.order_id) {
      throw new Error("[Cashfree] Order ID is required.");
    }
  }

  protected async initiate(
    data: CPaymentData,
  ): Promise<Record<string, unknown>> {
    try {
      console.log("[Cashfree initiate] received data:", JSON.stringify(data))
      const cashfree = await cashfreeinstance(this.appId);
      console.log("the first step2");
      const order = await cashfree.PGCreateOrder({
        order_amount: data.order_amount,
        order_currency: data.order_currency,
        order_id: data.order_id,
        customer_details: {
          customer_id: data.customer_id,
          customer_phone: data.customer_phone || "9999999999",
        },
      });
      console.log("the first step3");
      const orderData: OrderEntity = order.data;
      console.log("[Cashfree] Response from Cashfree API:", JSON.stringify(orderData)); 
      return orderData as unknown as Record<string, unknown>;
      console.log("the first step4");
      
    } catch (err: any) {
      console.log(err);
      console.log("the first step4", err);
      throw new Error(
        `[Cashfree] Failed to initiate order: ${err.message || err}`,
      );
    }
  }

  protected async confirm(
    order: Record<string, unknown>,
  ): Promise<IPaymentResponse> {
    return this.adapter.normalize(order);
  }
}
