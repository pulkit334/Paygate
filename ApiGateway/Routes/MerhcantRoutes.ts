import express, { Request, Response, NextFunction } from "express";
import { merchantClient, GRPC_DEADLINE_MS } from "../GrpcRef/Grpc";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth";
import { JWT_TTL_MS } from "../Middleware/session";
import AppError from "../utils/Error";
import { mapGrpcError } from "../utils/grpcErrors";
import jwt from "jsonwebtoken";

const router = express.Router();

interface GrpcError {
  message: string;
  code: number;
  details?: string;
  metadata?: any;
}

interface LoginResponse {
  token: string;
  merchant: Record<string, unknown>;
}

interface RegisterResponse {
  message: string;
  merchant: Record<string, unknown>;
}

router.post(
  "/auth/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ((req.session.userApps || []).length >= 3) {
        return next(
          AppError.SessionLimitExceeded(
            "You can only be logged into 3 apps at a time. Please log out of one first.",
          ),
        );
      }

      const email = req.body.email?.trim().toLowerCase();
      const password = req.body.password?.trim();

      if (!email) throw AppError.Validation("Email is required");
      if (!password) throw AppError.Validation("Password is required");

      const grpcPayload = {
        ownerEmail: email,
        password: password,
      };

      const deadline = new Date(Date.now() + GRPC_DEADLINE_MS);

      merchantClient.Login(
        grpcPayload,
        { deadline },
        (err: GrpcError | null, response: LoginResponse) => {
          if (err) {
            return next(mapGrpcError(err, "Login"));
          }
          const decoded = jwt.decode(response.token) as {
            appId: string;
            exp?: number;
          } | null;
          if (!decoded || !decoded.appId) {
            return next(AppError.Auth("Invalid token received"));
          }

          const appId = decoded.appId;
          const now = Date.now();
          const issuedAt = now;
          // Use JWT's own exp if available, otherwise calculate from our TTL
          const expiresAt = decoded.exp
            ? decoded.exp * 1000 // convert from seconds to ms
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
        },
      );
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/auth/register",
  async (req: Request, res: Response, next: NextFunction) => {
    if ((req.session.userApps || []).length >= 3) {
      return next(
        AppError.SessionLimitExceeded(
          "You can only be logged into 3 apps at a time. Please log out of one first.",
        ),
      );
    }

    try {
      const name = req.body.name?.trim();
      const email = req.body.email?.trim().toLowerCase();
      const password = req.body.password?.trim();
      const callbackUrl = req.body.callbackUrl?.trim() || undefined;

      if (!name) throw AppError.Validation("Name is required");
      if (!email) throw AppError.Validation("Email is required");
      if (!password) throw AppError.Validation("Password is required");

      const grpcPayload: Record<string, string> = {
        name,
        ownerEmail: email,
        password,
      };

      if (callbackUrl) {
        grpcPayload.callbackUrl = callbackUrl;
      }

      const deadline = new Date(Date.now() + GRPC_DEADLINE_MS);

      merchantClient.Auth(
        grpcPayload,
        { deadline },
        (err: GrpcError | null, response: RegisterResponse) => {
          if (err) {
            return next(mapGrpcError(err, "Register"));
          }

          res.status(201).json(response);
        },
      );
    } catch (error) {
      next(error);
    }
  },
);

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

      const deadline = new Date(Date.now() + GRPC_DEADLINE_MS);

      merchantClient.CreateApiKey(
        { appId, name, expiresAt },
        { deadline },
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

      const deadline = new Date(Date.now() + GRPC_DEADLINE_MS);

      merchantClient.DeleteApiKey(
        { keyId, appId },
        { deadline },
        (err: any, response: any) => {
          if (err) {
            return next(AppError.Payment(err.message));
          }
          res.status(200).json(response);
        },
      );
    } catch (err: any) {
      next(err);
    }
  },
);

export default router;
