
export interface IPaymentGateway {
  processPayment(data: any, appId: string): Promise<any>;
}