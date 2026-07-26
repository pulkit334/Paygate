import {
  IPaymentAdapter,
  IPaymentResponse,
} from "../../Interfaces/PaymentAdapters";

export class RazorpayAdapter implements IPaymentAdapter {
  normalize(raw: any): IPaymentResponse {
    return {
      orderId: String(raw.id),
      amount: Number(raw.amount) / 100,
      currency: String(raw.currency),
      status: String(raw.status),
    };
  }
}

