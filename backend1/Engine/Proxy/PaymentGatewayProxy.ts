import { IPaymentGateway } from "../../Interfaces/paymentgateway";

const NON_RETRYABLE_MESSAGES = [
  "Invalid amount",
  "Currency is required",
  "Receipt ID is required",
  "Razorpay Key ID not configured",
  "Razorpay Secretkey ID not configured",
];

const GATEWAY_TIMEOUT_MS = 30000;

function isRetryable(error: any): boolean {
  const msg = error?.message || "";
  return !NON_RETRYABLE_MESSAGES.some((m) => msg.includes(m));
}

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
  private maxRetries: number;

  constructor(gateway: IPaymentGateway, maxRetries = 3) {
    this.RealGateway = gateway;
    this.maxRetries = maxRetries;
  }

  public async processPayment(data: any, appId: string): Promise<any> {
    let attempt = 0;
    let cap = 10000;
    while (attempt < this.maxRetries) {
      try {
        attempt++;
        return await withTimeout(
          this.RealGateway.processPayment(data, appId),
          GATEWAY_TIMEOUT_MS,
          "Gateway call",
        );
      } catch (error: any) {
        if (!isRetryable(error) || attempt >= this.maxRetries) {
          throw error;
        }

        const baseDelay = 1000;
        const exponentialvalue = baseDelay * Math.pow(2, attempt);
        const currentCeiling = Math.min(cap, exponentialvalue);
        const totalWaitTime = Math.floor(Math.random() * currentCeiling);

        console.log(
          `[Proxy Shield] Attempt ${attempt} failed. Retrying in ${totalWaitTime}ms...`,
        );

        await new Promise((r) => setTimeout(r, totalWaitTime));
      }
    }
    throw new Error("Unexpected Proxy Failure");
  }
}
