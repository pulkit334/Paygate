// Step 1: Initialize Consumer Group
// Register this worker to 'webhook-group'. This tells Redis to route each message to only ONE worker, preventing duplicate webhooks.

// Step 2: The Infinite Polling Loop
// Ask Redis for new messages but use 'BLOCK'. This pauses the loop for 5 seconds if the queue is empty, saving your CPU from crashing.

// Step 3: Parse Data & Validate
// Convert the raw Redis array into a usable JavaScript object. If the 'callbackUrl' is missing, delete the message and skip to avoid a crash.

// Step 4: Cryptographic Security (HMAC)
// Hash the payment data using your secret key. The merchant checks this signature to prove hackers aren't sending fake payment successes.

// Step 5: The Delivery Engine (Exponential Backoff)
// Try to send the HTTP POST request. If the merchant's server is down, catch the error, wait a few seconds (2s, then 4s), and try again (max 3 times).

// Step 6: The Immutable Audit Trail
// Whether the webhook succeeded on the 1st try or failed on the 3rd, save the exact final outcome to MongoDB for your database records.

// Step 7: Queue Cleanup (XACK)
// Send the "Acknowledge" command to Redis. This permanently deletes the message from the queue because the job is 100% finished.

// Step 8: Global Fault Tolerance
// Wrap everything in a master try/catch. If the Redis database drops offline, the worker pauses for 2 seconds and retries instead of shutting down.




import { redisClient } from '../config/redis';
import axios from 'axios';
import crypto from 'crypto';
import WebhookDelivery from '../Modals/WebhookDelivery';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const startWebhookService = async () => {

    // ==========================================
    // STEP 1: INITIALIZATION & HANDSHAKE
    // Tell Redis this worker belongs to the 'webhook-group'
    // so Redis handles contention and prevents duplicate sends.
    // ==========================================
    try {
        await redisClient.xgroup('CREATE', 'payment.stream', 'webhook-group', '0', 'MKSTREAM');
        console.log(`[Webhook Service] Consumer group 'webhook-group' ready.`);
    } catch (err: any) {
        if (!err.message.includes('BUSYGROUP')) {
            console.error('[Webhook Service] XGROUP error:', err.message);
        }
    }

    console.log(`[Webhook Service] Loop initialized. Watching 'payment.stream'...`);

    // ==========================================
    // STEP 2: THE INFINITE POLLING LOOP
    // Act as a background daemon. Pause (Block) for 5 seconds 
    // waiting for new messages to keep CPU usage low.
    // ==========================================
    while (true) {
        try {
            const results = await redisClient.xreadgroup(
                'GROUP', 'webhook-group', 'backend2',
                'COUNT', '10',
                'BLOCK', '5000',
                'STREAMS', 'payment.stream', '>'
            ) as any;

            if (!results) continue; // Stream is empty, loop around and block again

            for (const [, messages] of results) {
                for (const [messageId, fields] of messages) {
                    
                    // ==========================================
                    // STEP 3: DATA PARSING & VALIDATION
                    // Convert Redis flat array [key, val, key, val] into an object.
                    // If the callbackUrl is missing, delete the message to prevent crashes.
                    // ==========================================
                    const data: any = {};
                    for (let i = 0; i < fields.length; i += 2) {
                        data[fields[i]] = fields[i + 1];
                    }

                    if (!data.callbackUrl) {
                        await redisClient.xack('payment.stream', 'webhook-group', messageId);
                        continue;
                    }

                    console.log(`📥 [Webhook Service] Processing transaction: ${data.transactionId}`);

                    const payload = {
                        event: 'payment.success',
                        appId: data.appId,
                        transactionId: data.transactionId,
                        amount: data.amount,
                        currency: data.currency
                    };

                    // ==========================================
                    // STEP 4: CRYPTOGRAPHIC SECURITY
                    // Generate an HMAC signature so the merchant 
                    // can verify this request actually came from us.
                    // ==========================================
                    const signature = crypto
                        .createHmac('sha256', process.env.WEBHOOK_SIGNING_SECRET as string)
                        .update(JSON.stringify(payload))
                        .digest('hex');

                    let attempt = 0;
                    const maxRetries = 3;
                    let responseStatus = 500;
                    let deliveryStatus = 'failed';

                    // ==========================================
                    // STEP 5: THE DELIVERY ENGINE (EXPONENTIAL BACKOFF)
                    // Try to send the HTTP request. If the merchant's server 
                    // is dead, catch the error and backoff (2s, then 4s).
                    // ==========================================
                    while (attempt < maxRetries) {
                        attempt++;
                        try {
                            console.log(`[Webhook Service] 🌐 POST to ${data.callbackUrl} (Attempt ${attempt}/${maxRetries})`);

                            const response = await axios.post(data.callbackUrl, payload, {
                                headers: { 'x-paygate-signature': signature },
                                timeout: 5000 // Force fail if merchant hangs longer than 5 seconds
                            });

                            responseStatus = response.status;
                            deliveryStatus = 'success';
                            console.log(`[Webhook Service] ✅ Delivered. HTTP ${responseStatus}`);
                            break; // Success! Exit the retry loop

                        } catch (error: any) {
                            responseStatus = error.response ? error.response.status : 500;
                            console.error(`[Webhook Service] ⚠️ Attempt ${attempt} failed: HTTP ${responseStatus}`);

                            if (attempt < maxRetries) {
                                const delay = attempt * 2000; 
                                console.log(`[Webhook Service] Backing off. Retrying in ${delay}ms...`);
                                await sleep(delay);
                            }
                        }
                    }

                    // ==========================================
                    // STEP 6: THE IMMUTABLE AUDIT TRAIL
                    // Regardless of success or total failure, save the 
                    // final outcome to MongoDB for merchant dashboards.
                    // ==========================================
                    try {
                        await WebhookDelivery.create({
                            appId: data.appId,
                            transactionId: data.transactionId,
                            targetUrl: data.callbackUrl,
                            payload,
                            signature,
                            attempt: attempt,
                            status: deliveryStatus,
                            responseCode: responseStatus,
                            sentAt: new Date()
                        });
                    } catch (dbError: any) {
                        console.error('[Webhook Service] MongoDB Save Error:', dbError.message);
                    }

                    // ==========================================
                    // STEP 7: QUEUE CLEANUP (XACK)
                    // Tell Redis the job is done so it deletes the message 
                    // from the Pending Entries List (PEL).
                    // ==========================================
                    await redisClient.xack('payment.stream', 'webhook-group', messageId);
                    console.log(`🗑️ [Webhook Service] XACK complete for message ${messageId}`);
                }
            }
        } catch (loopError: any) {
            // ==========================================
            // STEP 8: GLOBAL FAULT TOLERANCE
            // If Redis database drops connection, prevent Node crash.
            // Pause 2 seconds and loop back to try reconnecting.
            // ==========================================
            console.error('[Webhook Service] Main loop error:', loopError.message);
            await sleep(2000); 
        }
    }
};