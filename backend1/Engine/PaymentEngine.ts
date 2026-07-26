import Razorpay from "razorpay";
import { GatewayType } from "../types/GatewayTypes";
import { RazerPayProvider } from "./providers/RazerPay";
import { PaymentGatewayProxy } from "./Proxy/PaymentGatewayProxy";
import { IPaymentGateway } from "../Interfaces/paymentgateway";
import {RazorpayAdapter} from "../Engine/adapters/Razerpayadapter"
import { CashfreeProvider } from "./providers/cashfree";
import { CashfreeAdapter } from "./adapters/cashfreeadapter";
export class GatewayFactory {
  private static instance: GatewayFactory;

  private constructor() {}

  static getInstance(): GatewayFactory {
    if (!GatewayFactory.instance) {
      GatewayFactory.instance = new GatewayFactory();
    }
    return GatewayFactory.instance;
  }

  getGateway(type: GatewayType, appId: string): IPaymentGateway {
    switch (type) {
      case GatewayType.RAZORPAY:
        const RealProvider = new RazerPayProvider(appId,new RazorpayAdapter());
        const ProxyFactory = new PaymentGatewayProxy(RealProvider, 5);
        return ProxyFactory;
      case GatewayType.PAYTM:
      case GatewayType.CASHFREE:
        const RealProvider2 = new CashfreeProvider(appId,new CashfreeAdapter());
        const ProxyFactory2 = new PaymentGatewayProxy(RealProvider2,5);
        return ProxyFactory2;
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
