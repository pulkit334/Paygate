import express, { Request, Response, NextFunction } from "express";
import AppError from "../utils/Error";
import { merchantClient } from "../GrpcRef/Grpc";

const router = express.Router();

// Get settings
router.get("/settings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = (req as any).merchant._id;

    if (!appId) {
      throw AppError.Validation("Unauthorized");
    }

    merchantClient.GetSettings({ appId }, (err: any, response: any) => {
      if (err) {
        return next(AppError.Payment(err.message));
      }
      res.status(200).json(response);
    });
  } catch (error) {
    next(error);
  }
});

// List keys
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = (req as any).merchant._id;

    if (!appId) {
      throw AppError.Validation("Unauthorized");
    }

    merchantClient.ListApis({ appId }, (err: any, response: any) => {
      if (err) {
        return next(AppError.Payment(err.message));
      }
      res.status(200).json(response);
    });
  } catch (error) {
    next(error);
  }
});

// Delete keys
router.delete("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appId = (req as any).merchant._id;

    if (!appId) {
      throw AppError.Validation("Unauthorized");
    }

    merchantClient.DeleteApi({ appId }, (err: any, response: any) => {
      if (err) {
        return next(AppError.Payment(err.message));
      }
      res.status(200).json(response);
    });
  } catch (error) {
    next(error);
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

    merchantClient.UpdateCallbackUrl({ appId, callbackUrl }, (err: any, response: any) => {
      if (err) {
        return next(AppError.Payment(err.message));
      }
      res.status(200).json(response);
    });
  } catch (error) {
    next(error);
  }
});

export default router;
