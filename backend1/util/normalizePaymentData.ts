import crypto from "crypto";
import { PaymentData, CPaymentData } from "../Interfaces/paymentgateway";

export function normalizeToCPaymentData(data: PaymentData): CPaymentData {
  if (!data.amount || !data.currency || !data.receipt) {
    throw new Error(
      `[Normalize] Missing required payment fields: ${JSON.stringify(data)}`,
    );
  }

  const customerEmail = data.customerEmail || "";
  const customer_id = customerEmail
    ? `cust_${crypto.createHash("sha256").update(customerEmail.toLowerCase().trim()).digest("hex").slice(0, 16)}`
    : `guest_${Date.now()}`;

  return {
    order_amount: data.amount,
    order_currency: data.currency,
    order_id: data.receipt,
    customer_id,
    order_status: "created",
  };
}
