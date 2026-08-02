import { cashfreeinstance } from "../../../config/providerconfig";
import { IVerifyAdapters, IVerifyResult } from "../../../Interfaces/VerifyAdapters";


export class CashfreeVerifyAdapter implements IVerifyAdapters {
  async verify(data: any, appId: string, transaction: any): Promise<IVerifyResult> {
    if (transaction.status === "paid") {
      return {
        success: true,
        status: "paid",
        message: "Payment verified and Ledger is already updated.",
      };
    }


    const cashfree = await cashfreeinstance(appId);
    const orderResp = await (cashfree as any).PGFetchOrder(transaction.GatewayOrderId);
    const orderStatus = orderResp?.data?.order_status;

    if (orderStatus === "PAID") {
      transaction.GatewayPayId = orderResp.data.cf_order_id ?? "";
      await transaction.save();
      return {
        success: true,
        status: "processing",
        message: "Order confirmed paid via Cashfree.",
      };
    }

    return {
      success: false,
      status: "failed",
      message: `Order not paid. Status: ${orderStatus}`,
    };
  }
}