import { isAxiosError } from "axios";
import { api } from "./client";

export const APPS = {
  REGENERATE_KEYS: "/apps/regenerate-keys",
  CALLBACK_URL: "/apps/callback-url",
  SETTINGS: "/apps/settings",
};

export interface KeysResponse {
  publicKey: string;
  secretKey: string;
}

export interface AppSettings {
  callbackUrl: string;
  publicKey: string;
}

export const rotateKeys = async (): Promise<KeysResponse> => {
  try {
    const response = await api.post(APPS.REGENERATE_KEYS);
    return response?.data;
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err.response?.data?.code;
      if (code === "ORDER_CREATION_FAILED") {
        throw new Error("Failed to create payment order", { cause: err });
      }
    }
    throw err;
  };
};

export const updateCallbackUrl = async (callbackUrl: string): Promise<void> => {
  try {
    await api.put(APPS.CALLBACK_URL, { callbackUrl });
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err.response?.data?.code;
      if (code === "INVALID_CALLBACK_URL") {
        throw new Error("Invalid callback URL format", { cause: err });
      }
    }
    throw err;
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const response = await api.get(APPS.SETTINGS);
    return response.data;
  } catch (err) {
if(isAxiosError(err)){
  const code = err?.response?.data;
  if(code =="Internal Server Error"){
      throw new Error("Invalid callback URL format", {cause : err});
  }
}
    throw err;
  }
  
};
