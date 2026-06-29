import { isAxiosError } from "axios";
import { PaymentApi } from "./client";

export const WEBHOOKS = {
  DELIVERIES: "/webhooks",
  RETRY: "/webhooks/retry",
};

export interface WebhookDelivery {
  id: string;
  targetUrl: string;
  status: string;
  attemptNumber: number;
  httpResponseCode: number;
  createdAt: string;
}

export const getDeliveries = async (params?: {
  from?: string;
}): Promise<WebhookDelivery[]> => {
  try {
    const response = await PaymentApi.get(WEBHOOKS.DELIVERIES, { params });
    const data = response.data;
    return data.data ?? [];
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err?.response?.data;
      if (code == "Internal Server Error") {
        throw new Error("Invalid callback URL format", { cause: err });
      }
    }
    throw err;
  }
};
export const retryDelivery = async (id: string): Promise<void> => {
  try {
    await PaymentApi.post(`${WEBHOOKS.RETRY}/${id}`);
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err.response?.data?.code;
      if (code === "RETRY_FAILED") {
        throw new Error("Failed to retry webhook delivery", { cause: err });
      }
    }
    throw err;
  }
};
