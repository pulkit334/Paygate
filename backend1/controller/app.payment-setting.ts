import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";
import ProviderKey from "../models/providerKey";

export const UpdateProviderKey = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { appId, provider, keyId, keySecret } = call.request;

    if (!appId || !provider || !keyId || !keySecret) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId, provider, keyId, and keySecret are required",
      });
    }

    const existing = await ProviderKey.findOne({ appId, provider });

    if (existing) {
      existing.keyId = keyId;
      existing.keySecret = keySecret;
      existing.isActive = true;
      await existing.save();
    } else {
      await ProviderKey.create({ appId, provider, keyId, keySecret, isActive: true });
    }

    callback(null, { success: true, message: `${provider} keys updated successfully` });
  } catch (err: any) {
    callback({
      code: status.INTERNAL,
      message: err.message || "Failed to update provider keys",
    });
  }
};

export const GetProviderKeys = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { appId } = call.request;

    if (!appId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId is required",
      });
    }

    const keys = await ProviderKey.find({ appId }).select("-keySecret").sort({ createdAt: -1 });

    callback(null, {
      keys: keys.map((k) => ({
        provider: k.provider,
        keyId: k.keyId,
        isActive: k.isActive,
        createdAt: k.createdAt?.toISOString() || "",
      })),
    });
  } catch (err: any) {
    callback({
      code: status.INTERNAL,
      message: err.message || "Failed to fetch provider keys",
    });
  }
};

export const DeleteProviderKey = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { appId, provider } = call.request;

    if (!appId || !provider) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId and provider are required",
      });
    }

    const deleted = await ProviderKey.findOneAndDelete({ appId, provider });

    if (!deleted) {
      return callback({
        code: status.NOT_FOUND,
        message: `No ${provider} keys found for this app`,
      });
    }

    callback(null, { success: true, message: `${provider} keys disconnected` });
  } catch (err: any) {
    callback({
      code: status.INTERNAL,
      message: err.message || "Failed to delete provider keys",
    });
  }
};
