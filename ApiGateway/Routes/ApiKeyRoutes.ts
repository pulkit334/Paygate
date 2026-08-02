import express, { Request, Response, NextFunction } from "express";
import AppError from "../utils/Error.js";
import { merchantClient } from "../GrpcRef/Grpc.js";
import { callWithPolicy } from "../GrpcRef/paymentGrpcclient.js";

const router = express.Router();

// Get settings
router.get("/settings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = (req as any).merchant._id;

    if (!appId) {
      throw AppError.Validation("Unauthorized");
    }

    const response = await callWithPolicy(merchantClient, "GetSettings", { appId });
    res.status(200).json(response);
  } catch (error: any) {
    next(error instanceof AppError ? error : AppError.Payment(error.message));
  }
});

// List keys
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = (req as any).merchant._id;

    if (!appId) {
      throw AppError.Validation("Unauthorized");
    }

    const response = await callWithPolicy(merchantClient, "ListApis", { appId });
    res.status(200).json(response);
  } catch (error: any) {
    next(error instanceof AppError ? error : AppError.Payment(error.message));
  }
});

// Delete keys
router.delete("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = (req as any).merchant._id;

    if (!appId) {
      throw AppError.Validation("Unauthorized");
    }

    const response = await callWithPolicy(merchantClient, "DeleteApi", { appId });
    res.status(200).json(response);
  } catch (error: any) {
    next(error instanceof AppError ? error : AppError.Payment(error.message));
  }
});

router.put("/updateCallbackUrl", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = (req as any).merchant._id;
    const { callbackUrl } = req.body;

    if (!appId) {
      throw AppError.Validation("Unauthorized");
    }

    if (!callbackUrl) {
      throw AppError.Validation("callbackUrl is required");
    }

    const response = await callWithPolicy(merchantClient, "UpdateCallbackUrl", { appId, callbackUrl });
    res.status(200).json(response);
  } catch (error: any) {
    next(error instanceof AppError ? error : AppError.Payment(error.message));
  }
});

export default router;
