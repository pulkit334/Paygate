import express, { Request, Response } from "express";
import { merchantClient } from "../GrpcRef/Grpc";
import AppError from "../utils/Error";
AppError
const router = express.Router();

router.post("/login", async (req: Request, res: Response, next) => {
  try {
    // ← ADD VALIDATION
    if (!req.body.email) {
      throw AppError.Validation("Email is required");
    }
    if (!req.body.password) {
      throw AppError.Validation("Password is required");
    }

    const grpcPayload = {
      ownerEmail: req.body.email,
      password: req.body.password,
    };

    // ← USE AppError.Auth()
    merchantClient.Login(grpcPayload, (err: any, Response: any) => {
      if (err) {
        return next(AppError.Auth(err.message, 401)); // 401 for invalid credentials
      }
      res.status(200).json(Response);
    });
  } catch (error) {
    next(error); // ← PASS TO GLOBAL HANDLER
  }
});

router.post("/register", (req: Request, res: Response, next) => {
  try {
    // ← ADD VALIDATION
    if (!req.body.name) {
      throw AppError.Validation("Name is required");
    }
    if (!req.body.email) {
      throw AppError.Validation("Email is required");
    }
    if (!req.body.password) {
      throw AppError.Validation("Password is required");
    }

    const grpcPayload = {
      name: req.body.name,
      ownerEmail: req.body.email,
      password: req.body.password,
      callbackUrl: req.body.callbackUrl || "",
    };
    merchantClient.Auth(grpcPayload, (err: any, response: any) => {
      if (err) {
        return next(AppError.Auth(err.message));
      }
      console.log("gRPC response:", response);
      res.status(201).json(response);
    });
  } catch (error) {
    next(error); // ← PASS TO GLOBAL HANDLER
  }
});

export default router;