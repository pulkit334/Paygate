import { ServerUnaryCall, sendUnaryData, status } from "@grpc/grpc-js";
import { generateApikeys } from "../util/keygen";
import App from "../models/app";

export const CreateApiKey = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { appId, name, expiresAt } = call.request;

    if (!appId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId is required",
      });
    }
    if (!name) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "name is required",
      });
    }

    const { publicKey, Secretkey, hashedSecret } = generateApikeys();

    const app = await App.findById(appId);
    if (!app) {
      return callback({
        code: status.NOT_FOUND,
        message: "App not found",
      });
    }

    app.apiKeys.push({
      name,
      publicKey,
      hashedSecret,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
      createdAt : new Date()
    });

    await app.save();

    const savedKey = app.apiKeys[app.apiKeys.length - 1];

    callback(null, {
      success: true,
      id: savedKey._id?.toString() ?? "",
      name,
      publicKey,
      secretKey: Secretkey,
      createdAt: savedKey.createdAt.toISOString(),
      expiresAt: expiresAt || "",
    });
  } catch (err: any) {
    callback({
      code: status.INTERNAL,
      message: err.message || "Failed to create API key",
    });
  }
};

export const ListApiKeys = async (
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

    const app = await App.findById(appId);
    if (!app) {
      return callback({
        code: status.NOT_FOUND,
        message: "App not found",
      });
    }

    callback(null, {
      success: true,
      keys: app.apiKeys.map((k) => ({
        id: k._id?.toString() ?? "",
        name: k.name,
        maskedKey: k.publicKey,
        createdAt: k.createdAt.toISOString(),
        expiresAt: k.expiresAt ? k.expiresAt.toISOString() : "",
        isActive: k.isActive,
      })),
    });
  } catch (err: any) {
    callback({
      code: status.INTERNAL,
      message: err.message || "Failed to list API keys",
    });
  }
};

export const DeleteApiKey = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { keyId, appId } = call.request;

    if (!keyId || !appId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "keyId and appId are required",
      });
    }

    const app = await App.findById(appId);
    if (!app) {
      return callback({
        code: status.NOT_FOUND,
        message: "App not found",
      });
    }

    app.apiKeys = app.apiKeys.filter((k) => k._id?.toString() !== keyId);
    await app.save();

    callback(null, {
      success: true,
      message: "API key deleted",
    });
  } catch (err: any) {
    callback({
      code: status.INTERNAL,
      message: err.message || "Failed to delete API key",
    });
  }
};
