import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken"
import appSchema from "../models/app";
const Middleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    // change it later to cusotn file
    (req as any).user = decoded;

    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const ApiKeyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-api-key"] as string;
  if (!apiKey || !apiKey.toLowerCase().startsWith("sk_live_")) {
    return res
      .status(401)
      .json({ success: false, message: "Missing or invalid API key" });
  }
  const hashedIncoming = crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");

  const app = await appSchema.findOne({
    hashedSecret: hashedIncoming,
    isActive: true,
  });

  if (!app) {
    return res.status(401).json({ success: false, message: "Invalid API key" });
  }

  (req as any).app = app;
  next();
};

export { Middleware, ApiKeyMiddleware };
