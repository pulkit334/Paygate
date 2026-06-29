import express from "express";
import { GetWebhookHistory } from "../controller/webhook";

const router = express.Router();

router.get("/webhooks", GetWebhookHistory);

export default router;
