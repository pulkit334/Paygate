export interface IPaymentResponse {
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    paymentSessionId?: string;
}
export interface IPaymentAdapter {
  normalize(raw: any): IPaymentResponse;  
}
