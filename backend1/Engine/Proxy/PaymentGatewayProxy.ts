import { IPaymentGateway } from "../../Interfaces/paymentgateway";
import { BaseTemplate } from "../BaseTemplate";

export class PaymentGatewayProxy implements IPaymentGateway {
  private RealGateway: IPaymentGateway;
  private maxRetries: number;

  constructor(gateway:IPaymentGateway, maxRetries = 3) {
    this.RealGateway = gateway;
    this.maxRetries = maxRetries;
  }

  public async processPayment(data: any): Promise<any> {
    let attempt = 0;
    let cap = 10000;
    while (attempt < this.maxRetries) {
      try {
        attempt++;

        return  await this.RealGateway.processPayment(data);
      } catch (error: any) {
        if (attempt >= this.maxRetries) {
          throw new Error(
            `[Proxy Shield] Bank completely dead after ${this.maxRetries} attempts.`,
          );
        }

        const baseDelay = 1000;
        const exponentialvalue = baseDelay * Math.pow(2, attempt);
        const currentCeiling = Math.min(cap, exponentialvalue);

        const totalWaitTime = Math.floor(Math.random() * currentCeiling);

        console.log(
          `[Proxy Shield] Attempt ${attempt} failed. Resting for ${totalWaitTime}ms...`,
        );

         await new Promise((r) => setTimeout(r, totalWaitTime));
      }
    }
    throw new Error("Unexpected Proxy Failure");
  }
}
