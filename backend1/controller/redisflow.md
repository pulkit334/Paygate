Customer pays
        ↓
Razorpay → POST /webhooks/razorpay → backend1
        ↓
Verify HMAC signature
        ↓
MongoDB withTransaction()
    → find transaction
    → check idempotency
    → mark paid
    → create ledger entry
    → update account summary
        ↓
session.endSession()
        ↓
XADD payment.stream → Redis Stream
        ↓
res.status(200) → Razorpay
        ↓
backend2 XREADGROUP → reads from stream
        ↓
XACK → mark as received
        ↓
BullMQ queue.add()
        ↓
Worker → HMAC sign payload
        ↓
POST → merchant callbackUrl
        ↓
success → save WebhookDelivery status=success
        ↓
fail → BullMQ retry with exponential backoff
        ↓
3 fails → save WebhookDelivery status=failed