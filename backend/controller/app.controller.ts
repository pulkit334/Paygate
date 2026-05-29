import { Request, Response } from "express";
import { LoginSchema, RegisterAppSchema } from "../schema/app.schema";
import { ServerUnaryCall, sendUnaryData, status } from "@grpc/grpc-js";
import z from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import appservice from "../service/app.service";
import appSchema from "../models/app";
export const RegisterAppController = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const result = RegisterAppSchema.safeParse(call.request);
    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      return callback({
        code: status.INVALID_ARGUMENT,
        message: `Validation failed: ${JSON.stringify(fieldErrors)}`,
      });
    }

    const { name, ownerEmail, password, callbackUrl } = result.data;

    const data = await appservice(name, ownerEmail, password, callbackUrl);

    return callback(null, { success: true, data });
  } catch (error: any) {
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal server error",
    });
  }
};

export const LoginController = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const result = LoginSchema.safeParse(call.request);
    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      return callback({
        code: status.INVALID_ARGUMENT,
        message: `Validation failed: ${JSON.stringify(fieldErrors)}`,
      });
    }

    const { ownerEmail, password } = result.data;

    const app = await appSchema.findOne({ ownerEmail });
    if (!app) {
      return callback({
        code: status.NOT_FOUND,
        message: `Merchant E-Id Not Registered`,
      });
    }

    const isMatch = await bcrypt.compare(password, app.passwordHash);
    if (!isMatch) {
      return callback({
        code: status.UNAUTHENTICATED,
        message: `Invalid Password`,
      });
    }

    const token = jwt.sign(
      { appId: app._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    return callback(null, { success: true, token });
  } catch (error: any) {
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal server error",
    });
  }
};
