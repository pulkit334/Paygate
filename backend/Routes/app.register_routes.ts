import express from "express";
import {
  LoginController,
  RegisterAppController,
} from "../controller/app.controller";
import { ApiKeyMiddleware, Middleware } from "../middleware/auth";
const Router = express.Router();

//Register Route
Router.post("/register", RegisterAppController);
Router.post("/login", LoginController);
// Router.get("/analytics", Middle)
Router.get("/test-apikey", ApiKeyMiddleware, (req, res) => {
  res.json({ success: true, app: (req as any).app.name });
});

export default Router;
