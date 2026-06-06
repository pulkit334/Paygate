// api-gateway/middleware/auth.ts
import { NextFunction, Request, Response } from "express";
import { merchantClient } from "../GrpcRef/Grpc";

const ApiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey || !apiKey.toLowerCase().startsWith("sk_live_")) {
    return res.status(401).json({ message: "Invalid API key Invalid API key  starting me   Validate middleware me hai ye Invalid API key hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii   middleware validation one " });
  }
  console.log("Raw API key received:", apiKey);
  console.log("Type:", typeof apiKey);
  console.log("Length:", apiKey?.length);

  merchantClient.ValidateApiKey({ apiKey }, (err: any, response: any) => {
    console.log("Gateway received:", err, response); // ADD THIS
    console.log("response:", response); // is this null?

    if (err) {
      return res.status(500).json({ message: "Auth service unavailable" });
    }
    if (!response?.valid) {
      return res.status(401).json({ message: "Invalid API key Invalid API key ending me   Validate middleware me hai ye  Invalid API key hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii " });
    }
(req as any).app = {
  _id: response.appId,
  merchantId: response.merchantId
}
    next();
  });
};

export { ApiKeyMiddleware };
