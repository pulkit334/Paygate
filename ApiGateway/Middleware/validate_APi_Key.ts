import { NextFunction, Request, Response } from "express";
import { merchantClient } from "../GrpcRef/Grpc";
import AppError from "../utils/Error";

const ApiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      throw AppError.Validation("API key is required");
    }
    if (!apiKey.toLowerCase().startsWith("sk_live_")) {
      throw AppError.Validation("Invalid API key format");
    }

    console.log("Validating API key:", apiKey);

    merchantClient.ValidateApiKey({ apiKey }, (err: any, response: any) => {
      if (err) {
        return next(AppError.Service("Auth service unavailable"));
      }
      if (!response?.valid) {
        return next(AppError.Auth("Invalid API key", 401));
      }
      
      (req as any).app = {
        _id: response.appId,
        merchantId: response.merchantId,
      };
      
      next();
    });
  } catch (error) {
    next(error);
  }
};

export { ApiKeyMiddleware };