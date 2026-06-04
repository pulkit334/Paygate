// ApiGateway/middleware/jwtAuth.ts
import { Request, Response, NextFunction } from "express";
import { merchantClient } from "../GrpcRef/Grpc";

const JwtAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
      console.log("All headers:", req.headers)  // ← add this
  console.log("Auth header:", req.headers.authorization)
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  merchantClient.MiddlewareAuth({ token }, (err: any, response: any) => {
    if (err || !response?.valid) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    (req as any).merchant = {
      _id: response.appId,
    };

    next();
  });
};

export { JwtAuthMiddleware };