import { isAxiosError } from "axios";
import { api, MerchantApi } from "./client";

export const WEBHOOKS = {
  DELIVERIES: "/webhooks/deliveries",
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
  date?: string;
}): Promise<WebhookDelivery[]> => {
  try {
    const response = await MerchantApi.get(WEBHOOKS.DELIVERIES, { params });
    const data = response.data as WebhookDelivery[] | { deliveries: WebhookDelivery[] };
    return Array.isArray(data) ? data : (data.deliveries ?? []);
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
    await api.post(`${WEBHOOKS.RETRY}/${id}`);
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
