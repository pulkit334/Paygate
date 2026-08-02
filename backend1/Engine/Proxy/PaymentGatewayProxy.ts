import { IPaymentGateway } from "../../Interfaces/paymentgateway";

const GATEWAY_TIMEOUT_MS = 30000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export class PaymentGatewayProxy implements IPaymentGateway {
  private RealGateway: IPaymentGateway;

  constructor(gateway: IPaymentGateway) {
    this.RealGateway = gateway;
  }

  public async processPayment(data: any, appId: string): Promise<any> {
    return withTimeout(
      this.RealGateway.processPayment(data, appId),
      GATEWAY_TIMEOUT_MS,
      "Gateway call",
    );
  }
}
