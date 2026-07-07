/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { MerchantApi } from "../../services/client";
import { getSession, switchApp, logoutSession, logoutApp, type AppInfo } from "../../services/auth.service";

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
  activeApp: string | null;
  activeAppExpired: boolean;
  userApps: AppInfo[];
  sessionLoaded: boolean;
}

const initialState: UserState = {
  apiKeys: [],
  loading: false,
  error: null,
  newlyCreatedKey: null,
  activeApp: null,
  activeAppExpired: false,
  userApps: [],
  sessionLoaded: false,
};

// Fetch current session info
export const fetchSession = createAsyncThunk(
  "user/fetchSession",
  async (_, { rejectWithValue }) => {
    try {
      const session = await getSession();
      return session;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch session");
    }
  },
);

// Switch active app
export const switchActiveApp = createAsyncThunk(
  "user/switchApp",
  async (appId: string, { rejectWithValue }) => {
    try {
      await switchApp(appId);
      return appId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to switch app");
    }
  },
);

// Logout from all apps
export const logoutAllApps = createAsyncThunk(
  "user/logoutAll",
  async (_, { rejectWithValue }) => {
    try {
      await logoutSession();
      return true;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to logout");
    }
  },
);

// Logout from a specific app
export const logoutSingleApp = createAsyncThunk(
  "user/logoutApp",
  async (appId: string, { rejectWithValue }) => {
    try {
      const result = await logoutApp(appId);
      return { appId, result };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to logout from app");
    }
  },
);

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
    resetUser: (state) => {
      state.apiKeys = [];
      state.loading = false;
      state.error = null;
      state.newlyCreatedKey = null;
      state.activeApp = null;
      state.activeAppExpired = false;
      state.userApps = [];
      state.sessionLoaded = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Session
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.activeApp = action.payload.activeApp;
        state.activeAppExpired = action.payload.activeAppExpired;
        state.userApps = action.payload.userApps;
        state.sessionLoaded = true;
      })
      .addCase(fetchSession.rejected, (state) => {
        state.activeApp = null;
        state.activeAppExpired = false;
        state.userApps = [];
        state.sessionLoaded = true;
      })
      .addCase(switchActiveApp.fulfilled, (state, action) => {
        state.activeApp = action.payload;
        state.activeAppExpired = false;
      })
      .addCase(logoutAllApps.fulfilled, (state) => {
        state.activeApp = null;
        state.activeAppExpired = false;
        state.userApps = [];
        state.apiKeys = [];
      })
      .addCase(logoutSingleApp.fulfilled, (state, action) => {
        const { result } = action.payload;
        if (result.authenticated === false) {
          state.activeApp = null;
          state.activeAppExpired = false;
          state.userApps = [];
        } else if (result.userApps) {
          state.userApps = result.userApps;
          state.activeApp = result.activeApp;
        }
      })
      // API Keys
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

export const { clearNewlyCreatedKey, resetUser } = userSlice.actions;
export default userSlice.reducer;
