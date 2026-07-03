import { api } from "./client";

export interface ProviderKey {
  provider: string;
  keyId: string;
  isActive: boolean;
  createdAt: string;
}

export const getProviderKeys = async (): Promise<ProviderKey[]> => {
  const response = await api.get("/provider-keys");
  return response.data.keys || [];
};

export const saveProviderKey = async (data: {
  provider: string;
  keyId: string;
  keySecret: string;
}) => {
  const response = await api.post("/provider-keys", data);
  return response.data;
};

export const deleteProviderKey = async (provider: string) => {
  const response = await api.delete(`/provider-keys/${provider}`);
  return response.data;
};
