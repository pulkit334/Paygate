import { Request, Response } from "express";
import { LoginSchema, RegisterAppSchema } from "../schema/app.schema";
import { ServerUnaryCall, sendUnaryData, status } from "@grpc/grpc-js";
import z, { email } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import appservice from "../service/app.service";
import appSchema from "../models/app";
import { redisClient } from "../config/redis";
import Redis from "ioredis";
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

    // return flat object matching AuthRegisterRes proto
    return callback(null, {
      success: true,
      message: data.message,
      appId: data.appid.toString(),
      name: data.name,
      publicKey: data.publicKey,
      secretKey: data.Secretkey,
    });
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

    //  Step 1: Check Redis cache first
    let app = null;
    const cached = await redisClient.get(`user:${ownerEmail}`);

    if (cached) {
      //  Cache hit — no DB call needed
      app = JSON.parse(cached);
    } else {
      //  Cache miss — fetch from DB
      app = await appSchema.findOne({ ownerEmail });

      if (app) {
        //  Store in cache for 5 minutes
        await redisClient.set(
          `user:${ownerEmail}`,
          JSON.stringify(app),
          "EX",
          300,
        );
      }
    }

    //  Step 2: Check if user exists
    if (!app) {
      return callback({
        code: status.NOT_FOUND,
        message: `Merchant E-Id Not Registered`,
      });
    }

    //  Step 3: Verify password
    const isMatch = await bcrypt.compare(password, app.passwordHash);
    if (!isMatch) {
      return callback({
        code: status.UNAUTHENTICATED,
        message: `Invalid Password`,
      });
    }

    //  Step 4: Generate token
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

export const ValidateApiKey = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { apiKey } = call.request;
    console.log("ValidateApiKey called with:", apiKey);
    // Step 1 - check prefix
    if (!apiKey || !apiKey.toLowerCase().startsWith("sk_live_")) {
      return callback(null, {
        valid: false,
        message: "Invalid API key format",
      });
    }
    console.log("the request is behind the hash incoming service");
    // Step 2 - hash incoming key
    const hashedIncoming = crypto
      .createHash("sha256")
      .update(apiKey)
      .digest("hex");
    console.log("Hashed:", hashedIncoming);
    // Step 3 - find in DB
    const cached = await redisClient.get(`apikey:${hashedIncoming}`);
    if (cached) {
      return callback(null, JSON.parse(cached));
    }
    await redisClient.set(
      `apikey:${hashedIncoming}`,
      JSON.stringify(hashedIncoming),
      "EX",
      300,
    );

    const app = await appSchema.findOne({
      hashedSecret: hashedIncoming,
      isActive: true,
    });
    console.log("App found:", app); // ADD THIS

    if (!app) {
      return callback(null, {
        valid: false,
        message: "Invalid API key",
      });
    }
    console.log("Returning:", {
      valid: true,
      appId: app._id.toString(),
      merchantId: app._id.toString(),
      message: "Valid",
    });

    return callback(null, {
      valid: true,
      appId: app._id.toString(),
      merchantId: app._id.toString(),
      message: "Valid",
    });
  } catch (error: any) {
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal server error",
    });
  }
};
