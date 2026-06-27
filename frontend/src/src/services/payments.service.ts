import { api } from "./client";
import { handleError } from "../../utils/error.util";

export const PAYMENTS = {
  ALL: "/payments",
  ORDER: "/payments/order",
  VERIFY: "/payments/verify",
  GetTRANSCTION: "/transactions",
};
export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail: string;
  createdAt: string;
  transactionId: string;
  razorpayOrderId: string;
  metadata: Record<string, string>;
  failureReason?: string;
}

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
}

export const getPayments = async (params?: {
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<PaymentsResponse> => {
  const response = await api.get(PAYMENTS.ALL, { params });
  return response.data;
};

export const createOrder = async (data: {
  amount: number;
  currency?: string;
  customerEmail?: string;
}) => {
  try {
    const response = await api.post(PAYMENTS.ORDER, data);
    return response.data;
  } catch (err) {
    handleError(err);
  }
};

export const verifyPayment = async (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  try {
    const response = await api.post(PAYMENTS.VERIFY, data);
    return response?.data;
  } catch (err) {
    handleError(err);
  }
};

export const GetTransctions = async (params?: { from?: string; to?: string; limit?: number; offset?: number }) => {
  const response = await api.get(PAYMENTS.GetTRANSCTION, { params });
  return response?.data;
};
