export interface PaymentData {
  amount: number;
  currency: string;
  receipt: string;
  customerEmail?: string;

  
}

export interface CPaymentData {
  order_amount: number;
  order_currency: string;
  order_id: string;
  order_status: string;
  customer_id: string;
  customer_phone?: string;
  customer_email?: string;
}

export interface IPaymentGateway {
  processPayment(data: any, appId: string): Promise<any>;
}
