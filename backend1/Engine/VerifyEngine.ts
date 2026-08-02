import { IVerifyAdapters } from "../Interfaces/VerifyAdapters";
import { CashfreeVerifyAdapter } from "./adapters/verfiicationadapters/CashfreeVerifyAdapter";
import { RazorpayVerifyAdapter } from "./adapters/verfiicationadapters/RazorpayVerifyAdapter";


export class VerifyAdapterFactory {
  static get(provider: string): IVerifyAdapters {
    switch (provider.toUpperCase()) {
      case "RAZORPAY":
        return new RazorpayVerifyAdapter();
      case "CASHFREE":
        return new CashfreeVerifyAdapter();
      default:
        throw new Error(`[VerifyFactory] Unsupported provider: ${provider}`);
    }
  }
}