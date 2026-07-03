import { isAxiosError } from "axios";
import { api } from "./client";

export const ANALYTICS = {
  SUMMARY: "/analytics/summary",
  DAILY: "/analytics/daily",
};

export const LEDGER = {
  WALLET: "/ledger",
};

export interface Summary {
  totalReceived: number;
  totalTransactions: number;
  successRate: number;
  lastPaymentAt: string;
}

export interface DailyVolume {
  date: string;
  amount: number;
  count: number;
}

export interface LedgerWallet {
  success: boolean;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export const getSummary = async (): Promise<Summary> => {
  try {
    const response = await api.get(ANALYTICS.SUMMARY);
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      throw new Error(err.response?.data?.message || "Failed to fetch summary", { cause: err });
    }
    throw err;
  }
};

export const getDailyVolume = async (days: number = 7): Promise<DailyVolume[]> => {
  try {
    const response = await api.get(ANALYTICS.DAILY, { params: { days } });
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      throw new Error(err.response?.data?.message || "Failed to fetch daily volume", { cause: err });
    }
    throw err;
  }
};

export const getLedgerData = async (): Promise<LedgerWallet> => {
  try {
    const response = await api.get(LEDGER.WALLET);
    return response.data;
  } catch (err) {
    if (isAxiosError(err)) {
      throw new Error(err.response?.data?.message || "Failed to fetch ledger data", { cause: err });
    }
    throw err;
  }
};
