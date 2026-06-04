import Razorpay from "razorpay";
import { GatewayType } from "../types/GatewayTypes";
import { BaseTemplate } from "./BaseTemplate";
import { RazerPayProvider } from "./providers/RazerPay";
import { PaymentGatewayProxy } from "./Proxy/PaymentGatewayProxy";
import { IPaymentGateway } from "../Interfaces/paymentgateway";

export class GatewayFactory {
  // Step 1: Enforce Singleton pattern
  private static instance: GatewayFactory;  

  private constructor() {}

  // Step 2: Create the connection Method here Ref
  static getInstance(): GatewayFactory {
    if (!GatewayFactory.instance) {
      GatewayFactory.instance = new GatewayFactory();
    }
    return GatewayFactory.instance;
  }

  // Step 3: Define the factory contract
  getGateway(type: GatewayType): IPaymentGateway {
    // Step 4: Define the routing engine
    switch (type) {
      case GatewayType.RAZORPAY:
        const RealProvider = new RazerPayProvider();
        const ProxyFactory = new PaymentGatewayProxy(RealProvider, 5);
        return ProxyFactory;
      //   case GatewayType.MOCK:
      //     return new MockProvider();

      // Step 5: Enforce fail-fast guardrails
      case GatewayType.PAYTM:
      case GatewayType.STRIPE:
        throw new Error(
          `[GatewayFactory] Provider ${type} is registered but not implemented.`,
        );

      default:
        throw new Error(
          `[GatewayFactory] Fatal: Unsupported gateway type: ${type}`,
        );
    }
  }
}
