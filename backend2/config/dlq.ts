import cron from "node-cron";
import { redisClient } from "./redis";
import webhook_del from "../Modals/WebhookDelivery";

export const BackgroundDLQ = () => {
  // Runs every day at 3:00 AM
  cron.schedule("0 3 * * *", async () => {
    console.log("[CRON] Waking up. Checking for 24-hour old DLQ messages...");

    const EVERYDAY_TIMELIMIT = 24 * 60 * 60 * 1000;
    const LEFT_CUTTED_TIMESTAMP = Date.now() - EVERYDAY_TIMELIMIT;
    const cutoffId = `${LEFT_CUTTED_TIMESTAMP}-0`;

    // Fetch the data from the Redis Streams
    const oldMessages = (await redisClient.xrange(
      "payment.stream.dlq",
      "-",
      cutoffId,
      "COUNT",
      599,
    )) as any[];

    if (!oldMessages || oldMessages.length === 0) {
      console.log(
        "[CRON] DLQ is clean. No messages older than 24 hours found.",
      );
      return;
    }

    const docsToInsert = [];
    const datatoRemove: string[] = [];

    // 1. Loop and format the data
    for (const [messageId, fields] of oldMessages) {
      const data: any = {};
      for (let i = 0; i < fields.length; i += 2) {
        data[fields[i]] = fields[i + 1];
      }

      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(data.payload || "{}");
      } catch (e) {}

      docsToInsert.push({
        appId: data.appId,
        transactionId: data.originalMessageId,
        targetUrl: (parsedPayload as any)?.callbackUrl || "unknown",
        status: data.status || "failed",
        payload: parsedPayload,
        signature: "failed_in_transit",
        responseCode: 500,
        message: data.error || "Max retries exhausted",
        attempt: 3,
        sentAt: new Date(parseInt(messageId.split("-")[0])),
      });

      datatoRemove.push(messageId);
    }
    // THE FOR-LOOP MUST END HERE!
    if (docsToInsert.length > 0) {
      const bulkOperations = docsToInsert.map((doc) => ({
        updateOne: {
          filter: { transactionId: doc.transactionId },
          update: { $set: doc },
          upsert: true,
        },
      }));

      const result = await webhook_del.bulkWrite(bulkOperations, {
        ordered: false,
      });

      console.log(
        `[CRON] MongoDB BulkWrite Complete. ` +
          `Inserted/Upserted: ${result.upsertedCount}, ` +
          `Updated existing: ${result.modifiedCount}`,
      );
    }

    if (datatoRemove.length > 0) {
      await redisClient.xdel("payment.stream.dlq", ...datatoRemove);
      console.log(
        `[CRON] Deleted ${datatoRemove.length} records from Redis RAM.`,
      );
    }
  });
};
