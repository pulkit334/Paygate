/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { MerchantApi } from "../../services/client";

interface ApiKey {
  _id: string;
  name: string;
  publicKey: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

interface UserState {
  apiKeys: ApiKey[];
  loading: boolean;
  error: string | null;
  newlyCreatedKey: string | null;
}

const initialState: UserState = {
  apiKeys: [],
  loading: false,
  error: null,
  newlyCreatedKey: null,
};

export const fetchApiKeys = createAsyncThunk(
  "user/fetchApiKeys",
  async (_, { rejectWithValue }) => {
    try {
      const response = await MerchantApi.get("/api-keys");
      const data = response.data?.data;
      const keys = response.data?.keys || [];

      if (keys.length > 0) {
        return { keys };
      }

      if (data?.publicKey) {
        return {
          keys: [
            {
              _id: data._id || "legacy",
              name: "Default Key",
              publicKey: data.publicKey,
              isActive: data.isActive !== false,
              createdAt: data.createdAt || new Date().toISOString(),
              expiresAt: null,
            },
          ],
        };
      }

      return { keys: [] };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch API keys",
      );
    }
  },
);

export const createApiKey = createAsyncThunk(
  "user/createApiKey",
  async (payload: { name: string; expiresAt: Date | null }, { rejectWithValue }) => {
    try {
      const response = await MerchantApi.post("/register-new/api-key", {
        name: payload.name,
        expiresAt: payload.expiresAt,
      });
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
  async (keyId: string, { rejectWithValue }) => {
    try {
      await MerchantApi.delete(`/api-keys/${keyId}`);
      return keyId;
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
  reducers: {
    clearNewlyCreatedKey: (state) => {
      state.newlyCreatedKey = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApiKeys.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApiKeys.fulfilled, (state, action) => {
        state.loading = false;
        state.apiKeys = action.payload.keys || [];
      })
      .addCase(fetchApiKeys.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createApiKey.fulfilled, (state, action) => {
        state.apiKeys.push({
          _id: action.payload.id,
          name: action.payload.name,
          publicKey: action.payload.publicKey,
          isActive: true,
          createdAt: action.payload.createdAt,
          expiresAt: action.payload.expiresAt || null,
        });
        state.newlyCreatedKey = action.payload.secretKey;
      })
      .addCase(deleteApiKey.fulfilled, (state, action) => {
        state.apiKeys = state.apiKeys.filter((k) => k._id !== action.payload);
      });
  },
});

export const { clearNewlyCreatedKey } = userSlice.actions;
export default userSlice.reducer;
