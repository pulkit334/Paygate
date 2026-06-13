import express, { Request, Response, NextFunction } from "express";
import { merchantClient } from "../GrpcRef/Grpc";
import AppError from "../utils/Error";

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

      res.cookie("rememberme", 1, {
        maxAge: 60 * 60 * 24 * 1000,
        secure: process.env.NODE_ENV === "production",
        httpOnly: true, 
        sameSite: "lax",
      });

      res.status(200).json(response);
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
        return next(AppError.Auth(err.message));
      }

      res.status(201).json(response);
    });
  } catch (error) {
    next(error);
  }
});

export default router;