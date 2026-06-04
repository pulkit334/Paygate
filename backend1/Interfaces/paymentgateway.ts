
export interface IPaymentGateway {
  processPayment(data: any): Promise<any>;
}