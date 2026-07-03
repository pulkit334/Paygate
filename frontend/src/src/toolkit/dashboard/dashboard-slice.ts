/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getSummary, getDailyVolume, getLedgerData } from "../../services/analytics.service";
import { GetTransctions } from "../../services/payments.service";
import type { Summary, DailyVolume, LedgerWallet } from "../../services/analytics.service";
import type { Payment } from "../../services/payments.service";

interface DashboardState {
  summary: Summary | null;
  payments: Payment[];
  dailyVolume: DailyVolume[];
  ledger: LedgerWallet | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: DashboardState = {
  summary: null,
  payments: [],
  dailyVolume: [],
  ledger: null,
  loading: true,
  refreshing: false,
  error: null,
  lastUpdated: null,
};

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
        const [summary, paymentsRes, dailyVolume, ledger] = await Promise.all([
          getSummary().catch(() => null),
          GetTransctions({ limit: 5 }).catch(() => ({ transactions: [] })),
          getDailyVolume(7).catch(() => []),
          getLedgerData().catch(() => null),
        ]);
      return {
        summary,
        payments: (paymentsRes?.transactions ?? []).map((t: any) => ({ ...t, id: t.transactionId })),
        dailyVolume: Array.isArray(dailyVolume) ? dailyVolume : [],
        ledger,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load dashboard data");
    }
  },
);

export const refreshDashboardData = createAsyncThunk(
  "dashboard/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const [summary, paymentsRes, ledger] = await Promise.all([
        getSummary().catch(() => null),
        GetTransctions({ limit: 5 }).catch(() => ({ transactions: [] })),
        getLedgerData().catch(() => null),
      ]);
      return {
        summary,
        payments: (paymentsRes?.transactions ?? []).map((t: any) => ({ ...t, id: t.transactionId })),
        ledger,
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to refresh dashboard data");
    }
  },
);

export const refreshDailyVolume = createAsyncThunk(
  "dashboard/refreshDailyVolume",
  async (_, { rejectWithValue }) => {
    try {
      const dailyVolume = await getDailyVolume(7).catch(() => []);
      return Array.isArray(dailyVolume) ? dailyVolume : [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to refresh daily volume");
    }
  },
);


const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.summary;
        state.payments = action.payload.payments;
        state.dailyVolume = action.payload.dailyVolume;
        state.ledger = action.payload.ledger;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(refreshDashboardData.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(refreshDashboardData.fulfilled, (state, action) => {
        state.refreshing = false;
        state.summary = action.payload.summary;
        state.payments = action.payload.payments;
        state.ledger = action.payload.ledger;
        state.lastUpdated = Date.now();
      })
      .addCase(refreshDashboardData.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload as string;
      })
      .addCase(refreshDailyVolume.fulfilled, (state, action) => {
        state.dailyVolume = action.payload;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
