import express, { Request, Response, NextFunction } from "express";
import { merchantClient } from "../GrpcRef/Grpc";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth";
import { JWT_TTL_MS } from "../Middleware/session";
import AppError from "../utils/Error";
import jwt from "jsonwebtoken";

const router = express.Router();

interface GrpcError {
  message: string;
  code: number;
}

interface LoginResponse {
  token: string;
  merchant: Record<string, unknown>;
}

interface RegisterResponse {
  message: string;
  merchant: Record<string, unknown>;
}

router.post("/auth/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email) throw AppError.Validation("Email is required");
    if (!password) throw AppError.Validation("Password is required");

    const grpcPayload = {
      ownerEmail: email,
      password: password,
    };

    merchantClient.Login(grpcPayload, (err: GrpcError | null, response: LoginResponse) => {
      if (err) {
        return next(AppError.Auth(err.message, 401));
      }

      // Decode JWT to get appId and expiry
      const decoded = jwt.decode(response.token) as { appId: string; exp?: number } | null;
      if (!decoded || !decoded.appId) {
        return next(AppError.Auth("Invalid token received"));
      }

      const appId = decoded.appId;
      const now = Date.now();
      const issuedAt = now;
      // Use JWT's own exp if available, otherwise calculate from our TTL
      const expiresAt = decoded.exp
        ? decoded.exp * 1000  // convert from seconds to ms
        : now + JWT_TTL_MS;

      // Initialize session data if needed
      if (!req.session.tokens) {
        req.session.tokens = {};
      }
      if (!req.session.userApps) {
        req.session.userApps = [];
      }

      // Store token with metadata
      req.session.tokens[appId] = {
        jwt: response.token,
        issuedAt,
        expiresAt,
      };

      // Add to userApps if not already present
      if (!req.session.userApps.includes(appId)) {
        req.session.userApps.push(appId);
      }

      // Set as active app
      req.session.activeApp = appId;

      req.session.save((saveErr) => {
        if (saveErr) {
          return next(AppError.Auth("Failed to create session"));
        }

        res.status(200).json({
          success: true,
          appId,
          userApps: req.session.userApps,
          tokenExpiresAt: expiresAt,
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();
    const callbackUrl = req.body.callbackUrl?.trim() || "";

    if (!name) throw AppError.Validation("Name is required");
    if (!email) throw AppError.Validation("Email is required");
    if (!password) throw AppError.Validation("Password is required");

    const grpcPayload = {
      name,
      ownerEmail: email,
      password,
      callbackUrl,
    };

    merchantClient.Auth(grpcPayload, (err: GrpcError | null, response: RegisterResponse) => {
      if (err) {
        const isDuplicate = err.message?.toLowerCase().includes("already registered");
        return next(isDuplicate
          ? AppError.UniqueConstraint(err.message, "email")
          : AppError.Auth(err.message));
      }

      res.status(201).json(response);
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/register-new/api-key",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = (req as any).merchant._id;
      const name = req.body.name?.trim();
      const expiresAt = req.body.expiresAt || null;

      if (!appId) throw AppError.Validation("Unauthorized");
      if (!name) throw AppError.Validation("Name is required");

      merchantClient.CreateApiKey(
        { appId, name, expiresAt },
        (err: any, response: any) => {
          if (err) {
            return next(AppError.Payment(err.message));
          }
          res.status(201).json(response);
        },
      );
    } catch (err: any) {
      next(err);
    }
  },
);

router.delete(
  "/api-keys/:keyId",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = (req as any).merchant._id;
      const { keyId } = req.params;
      if (!appId) throw AppError.Validation("Unauthorized");
      if (!keyId) throw AppError.Validation("keyId is required");

      merchantClient.DeleteApiKey({ keyId, appId }, (err: any, response: any) => {
        if (err) {
          return next(AppError.Payment(err.message));
        }
        res.status(200).json(response);
      });
    } catch (err: any) {
      next(err);
    }
  },
);

export default router;
