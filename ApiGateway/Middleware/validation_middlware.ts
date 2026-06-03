// api-gateway/middleware/auth.ts
import { NextFunction, Request, Response } from "express";
import { merchantClient } from "../GrpcRef/Grpc";

const ApiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey || !apiKey.toLowerCase().startsWith("sk_live_")) {
    return res.status(401).json({ message: "Invalid API key" });
  }

  merchantClient.ValidateApiKey({ apiKey }, (err: any, response: any) => {
      console.log("Gateway received:", err, response); // ADD THIS

    if (err) {
      return res.status(500).json({ message: "Auth service unavailable" });
    }
    if (!response?.valid) {
      return res.status(401).json({ message: "Invalid API key" });
    }
    (req as any).app = {
      _id: response.appId,
      merchantId: response.merchantId
    };
    next();
  });
};

export { ApiKeyMiddleware };