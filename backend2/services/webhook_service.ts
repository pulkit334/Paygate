import { redisClient } from "../config/redis";
import webhook_del from "../Modals/WebhookDelivery";
import crypto from "crypto";
import axios from "axios";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const startWebhookService = async () => {
  try {
    await redisClient.xgroup(
      "CREATE",
      "payment.stream",
      "webhook-group",
      "0",
      "MKSTREAM",
    );
  } catch (err: any) {
    if (!err.message.includes("BUSYGROUP")) {
      console.error("[Webhook Service] XGROUP error:", err.message);
    }
  }

  while (true) {
    try {
      const results = (await redisClient.xreadgroup(
        "GROUP",
        "webhook-group",
        "backend2",
        "COUNT",
        "20",
        "BLOCK",
        "5000",
        "STREAMS",
        "payment.stream",
        ">", //doubt
      )) as any;

      if (!results) continue;

      for (const [, messages] of results) {
        for (const [messageId, fields] of messages) {
          const data: any = {};
          for (let i = 0; i < fields.length; i += 2) {
            data[fields[i]] = fields[i + 1];
          }

          if (!data.callbackUrl) {
            await redisClient.xack(
              "payment.stream",
              "webhook-group",
              messageId,
            );
            continue;
          }
          console.log(
            ` [Webhook Service] Processing transaction: ${data.transactionId}`,
          );

          const payload = {
            event: "payment.success",
            appId: data.appId,
            transactionId: data.transactionId,
            amount: data.amount,
            currency: data.currency,
          };

          const signature = crypto
            .createHmac("sha256", process.env.WEBHOOK_SIGNING_SECRET as string)
            .update(JSON.stringify(payload))
            .digest("hex");

          let attempt = 0;
          const maxRetries = 3;
          let responseStatus = 500;
          let deliveryStatus = "failed";

          while (attempt < maxRetries) {
            attempt++;
            try {
              const response = await axios.post(data.callbackUrl, payload, {
                headers: {
                  "x-paygate-signature": signature,
                },
              });
              responseStatus = response.status;
              deliveryStatus = "success";
              console.log(
                `[Webhook Service]   Delivered. HTTP ${responseStatus}`,
              );
              break;
            } catch (err: any) {
              responseStatus = err.response ? err.response.status : 500;
              console.error(
                `[Webhook Service]  Attempt ${attempt} failed: HTTP ${responseStatus}`,
              );

              if (attempt < maxRetries) {
                const baseDelay = Math.pow(2, attempt) * 1000;
               const jitter = Math.random() * baseDelay;
               const delay = Math.floor(jitter);
                console.log(
                  `[Webhook Service] Backing off. Retrying in ${delay}ms...`,
                );
                await sleep(delay);
              }
            }
          }

          try {
            await webhook_del.create({
              appId: data.appId,
              transactionId: data.transactionId,
              targetUrl: data.callbackUrl,
              status: data.status,
              payload: payload,
              signature: signature,
              responseCode: responseStatus,
              message: deliveryStatus,
              attempt: attempt,
              sentAt: new Date(),
            });
          } catch (dbError: any) {
            console.error(
              "[Webhook Service] MongoDB Save Error:",
              dbError.message,
            );
          }
          await redisClient.xack("payment.stream", "webhook-group", messageId);

          console.log(
            ` [Webhook Service] XACK complete for message ${messageId}`,
          );
        }
      }
    } catch (loopError: any) {
      console.error("[Webhook Service] Main loop error:", loopError.message);

      const isConnectionError =
        loopError.message.includes("ECONNREFUSED") ||
        loopError.message.includes("CONNECTION_CLOSED");

      if (isConnectionError) {
        console.log(
          "[Webhook Service] Database offline. Throttling loop for 2s...",
        );
        await sleep(2000);
      } else {
        await sleep(5000);
      }
    }
  }
};
