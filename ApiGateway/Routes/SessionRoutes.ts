import express, { Request, Response, NextFunction } from "express";
import AppError from "../utils/Error";

const router = express.Router();

const isTokenExpired = (expiresAt: number): boolean => {
  return Date.now() > expiresAt + 30 * 1000;
};

const buildAppsList = (session: any) => {
  const apps: Array<{
    appId: string;
    isActive: boolean;
    issuedAt: number;
    expiresAt: number;
    expired: boolean;
  }> = [];

  for (const appId of session.userApps || []) {
    const tokenData = session.tokens?.[appId];
    if (tokenData) {
      apps.push({
        appId,
        isActive: appId === session.activeApp,
        issuedAt: tokenData.issuedAt,
        expiresAt: tokenData.expiresAt,
        expired: isTokenExpired(tokenData.expiresAt),
      });
    }
  }
  return apps;
};

router.get("/session", (req: Request, res: Response) => {
  if (!req.session.activeApp) {
    return res.status(200).json({
      authenticated: false,
      activeApp: null,
      userApps: [],
    });
  }


  const activeToken = req.session.tokens?.[req.session.activeApp];
  const activeAppExpired = activeToken
    ? isTokenExpired(activeToken.expiresAt)
    : true;

  res.status(200).json({
    authenticated: true,
    activeApp: req.session.activeApp,
    activeAppExpired,
    userApps: buildAppsList(req.session),
  });
});
router.post("/session/switch", (req: Request, res: Response) => {
  const { appId } = req.body;

  if (!appId) {
    throw AppError.Validation("appId is required");
  }

  const tokenData = req.session.tokens?.[appId];
  if (!tokenData) {
    throw AppError.Validation(
      "App not found in session. Please login to this app first.",
    );
  }

  if (isTokenExpired(tokenData.expiresAt)) {
    return res.status(401).json({
      error: "TOKEN_EXPIRED",
      message: `Token for app ${appId} has expired. Please re-login to this app.`,
      appId,
    });
  }

  req.session.activeApp = appId;

  req.session.save((saveErr) => {
    if (saveErr) {
      return res.status(500).json({ error: "Failed to save session" });
    }
    res.status(200).json({
      success: true,
      activeApp: appId,
      expiresAt: tokenData.expiresAt,
    });
  });
});
router.post("/session/logout", (req: Request, res: Response) => {
  const sid = req.sessionID;

  req.session.destroy((err: any) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.clearCookie("pg.sid");
    res.status(200).json({
      success: true,
      message: "Logged out from all apps on this device",
      destroyedSessionId: sid,
    });
  });
});



router.delete("/session/apps/:appId", (req: Request, res: Response) => {
  const appId = req.params.appId as string;

  if (!req.session.tokens || !req.session.tokens[appId]) {
    throw AppError.Validation("App not found in session");
  }

  // Remove the app token from session
  delete req.session.tokens[appId];
  req.session.userApps = (req.session.userApps || []).filter(
    (id: string) => id !== appId,
  );

  // If we logged out of the active app, switch to another one
  if (req.session.activeApp === appId) {
    const remaining = req.session.userApps;
    req.session.activeApp = remaining.length > 0 ? remaining[0] : "";
  }

  // If no apps left, destroy entire session
  if (req.session.userApps.length === 0) {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Failed to clear session" });
      }
      res.clearCookie("pg.sid");
      return res.status(200).json({
        success: true,
        message: "Last app removed. Session cleared.",
        authenticated: false,
      });
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: `Logged out from app ${appId}`,
    activeApp: req.session.activeApp,
    userApps: buildAppsList(req.session),
  });
});

export default router;
