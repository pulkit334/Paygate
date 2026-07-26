import { IPaymentAdapter, IPaymentResponse } from "../../Interfaces/PaymentAdapters";

export class CashfreeAdapter implements IPaymentAdapter {
  normalize(raw: any): IPaymentResponse {
    return {
      orderId: String(raw.order_id),
      amount: Number(raw.order_amount),
      currency: String(raw.order_currency),
      status: String(raw.order_status),
      paymentSessionId: raw.payment_session_id ? String(raw.payment_session_id) : undefined,
    };
  }
}