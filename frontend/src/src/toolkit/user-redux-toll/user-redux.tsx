/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { MerchantApi } from "../../services/client";

interface ApiKey {
  _id: string;
  publicKey: string;
  isActive: boolean;
  createdAt: string;
}

interface UserState {
  apiKeys: ApiKey[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  apiKeys: [],
  loading: false,
  error: null,
};

export const fetchApiKeys = createAsyncThunk(
  "user/fetchApiKeys",
  async (_, { rejectWithValue }) => {
    try {
      const response = await MerchantApi.get("/api-keys");
      console.log("[API Keys] Response:", response.data);
      return response.data;
    } catch (err: any) {
      console.error("[API Keys] Error:", err.response?.data || err.message);
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch API keys",
      );
    }
  },
);

export const createApiKey = createAsyncThunk(
  "user/createApiKey",
  async (_, { rejectWithValue }) => {
    try {
      const response = await MerchantApi.post("/api-keys");
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create API key",
      );
    } 
  },
);

export const deleteApiKey = createAsyncThunk(
  "user/deleteApiKey",
  async (_, { rejectWithValue }) => {
    try {
      await MerchantApi.delete("/api-keys");
      return true;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete API key",
      );
    }
  },
);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApiKeys.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApiKeys.fulfilled, (state, action) => {
        state.loading = false;
        state.apiKeys = action.payload.data ? [action.payload.data] : [];
      })
      .addCase(fetchApiKeys.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createApiKey.fulfilled, (state, action) => {
        state.apiKeys.push(action.payload);
      })
      .addCase(deleteApiKey.fulfilled, (state, action) => {
        state.apiKeys = state.apiKeys.filter((k) => k._id !== action.payload);
      });
  },
});

export default userSlice.reducer;
