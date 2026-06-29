import express from "express";
import { GetWebhookHistory } from "../controller/webhook";
import { redisClient } from "../config/redis";

const router = express.Router();
let failOnce = true;

router.get("/webhooks", GetWebhookHistory);

router.post("/test-webhook", async (req, res) => {
  try {
    const { callbackUrl, appId } = req.body;

    await redisClient.xadd(
      "payment.stream",
      "*",
      "appId", appId || "test_app",
      "transactionId", `txn_${Date.now()}`,
      "callbackUrl", callbackUrl || "http://localhost:4000/api/flaky",
      "amount", "5000",
      "currency", "INR",
      "status", "success"
    );

    res.json({ success: true, message: "Test webhook added to stream" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/flaky", (req, res) => {
  if (failOnce) {
    failOnce = false;
    console.log("[Flaky] Failing first attempt");
    return res.status(500).json({ error: "Intentional fail" });
  }
  console.log("[Flaky] Succeeding on retry");
  failOnce = true;
  res.status(200).json({ success: true });
});

export default router;
