import { Request, Response, NextFunction } from "express";
import { merchantClient } from "../GrpcRef/Grpc";
import AppError from "../utils/Error";

const JwtAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session || !req.session.activeApp) {
      throw AppError.Validation("No active session. Please login.");
    }

    const appId = req.session.activeApp;
    const tokenData = req.session.tokens?.[appId];

    if (!tokenData) {
      throw AppError.Validation(
        "No token found for active app. Please login to this app.",
      );
    }

    const now = Date.now();
    const bufferMs = 30 * 1000;
    if (tokenData.expiresAt && now > tokenData.expiresAt + bufferMs) {
      return res.status(401).json({
        error: "Token expired for this app",
        type: "TOKEN_EXPIRED",
        appId,
        message: `Token for app ${appId} has expired. Please re-login to this app.`,
      });
    }

    merchantClient.MiddlewareAuth(
      { token: tokenData.jwt },
      (err: any, response: any) => {
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
      },
    );
  } catch (error) {
    next(error);
  }
};

export { JwtAuthMiddleware };
