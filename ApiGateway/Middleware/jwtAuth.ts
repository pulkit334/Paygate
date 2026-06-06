import { Request, Response, NextFunction } from "express";
import { merchantClient } from "../GrpcRef/Grpc";
import AppError from "../utils/Error"

const JwtAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.Validation("No token provided or invalid format");
    }

    const token = authHeader.split(" ")[1];

    merchantClient.MiddlewareAuth({ token }, (err: any, response: any) => {
      if (err) {
        return next(AppError.Auth("Token verification failed"));
      }
      if (!response?.valid) {
        return next(AppError.Auth("Invalid token"));
      }

      (req as any).merchant = {
        _id: response.appId,
      };

      next();
    });
  } catch (error) {
    next(error);
  }
};

export { JwtAuthMiddleware };