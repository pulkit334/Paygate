# PayGate — Full Build & Learning Plan
> From where you are now → deployed production system → interview ready

---

## Where You Are Now

```
✅ App registration + login
✅ Auth middleware (JWT + API key)
✅ Zod validation schemas
✅ createOrder controller
✅ verifyOrder controller
✅ Transaction model — complete
✅ Razorpay webhook — complete
✅ Atomic ledger write
✅ AccountSummary atomic update
✅ Routes — register, payment, webhook
✅ server.ts — structured
```

---

## The Master Plan

```
W5   Redis pub/sub           →  Observer pattern
W6   BullMQ + Worker Thread  →  Template Method pattern
W7   Analytics routes        →  Repository pattern
W8   Hardening               →  Proxy pattern
W9   Docker                  →  Singleton audit
W10  Deploy + test           →  Facade pattern
W11  OOP refactor            →  Factory + Strategy pattern
W12  Mock interviews         →  System design weekly
```

---

## Week 5 — Redis Pub/Sub + Observer Pattern

### What to build
```
backend1/config/redis.ts         ← publisher singleton
backend1/controller/app.webhook  ← add publish after commit
backend2/config/redis.ts         ← subscriber singleton
backend2/subscriber.ts           ← listen + pass to queue
```

### Code to write

```typescript
// backend1/config/redis.ts
import { createClient } from "redis";

const redisPublisher = createClient({ url: process.env.REDIS_URL });
redisPublisher.on("error", (err) => console.error("Redis error:", err));
redisPublisher.connect();

export default redisPublisher;

// backend1/controller/app.webhook.ts — add after session.endSession()
await redisPublisher.publish("payment.success", JSON.stringify({
  appId:         txn.appId,
  transactionId: txn._id.toString(),
  amount:        amountPaise,
  currency,
  callbackUrl:   txn.callbackUrl,
  paidAt:        new Date().toISOString(),
}));

// backend2/subscriber.ts
import { createClient } from "redis";

const subscriber = createClient({ url: process.env.REDIS_URL });
subscriber.connect();

subscriber.subscribe("payment.success", (message) => {
  const data = JSON.parse(message);
  // pass to BullMQ — Week 6
  console.log("Received payment.success:", data);
});
```

### Observer pattern — refactor after building
```typescript
// Before — direct publish scattered everywhere
await redisPublisher.publish("payment.success", data)

// After — clean Observer class
class PaymentEventBus {
  async emit(event: string, data: object) {
    await redisPublisher.publish(event, JSON.stringify(data))
  }
  async on(event: string, handler: (data: any) => void) {
    await subscriber.subscribe(event, (msg) => handler(JSON.parse(msg)))
  }
}

const eventBus = new PaymentEventBus()
// publish
await eventBus.emit("payment.success", payload)
// subscribe
eventBus.on("payment.success", (data) => webhookQueue.add(data))
```

### What to learn this week
```
1. Redis pub/sub
   → createClient, publish, subscribe
   → one client cannot both publish and subscribe
   → need two separate clients

2. Observer pattern
   → publisher does not know who is listening
   → decoupling — backend1 does not call backend2 directly
   → adding a new consumer = zero changes to backend1

3. Redis data types
   → String, Hash, List, Set, Sorted Set
   → know when to use each
```

---

## Week 6 — BullMQ + Worker Threads + Template Method

### What to build
```
backend2/workers/webhookQueue.ts    ← BullMQ queue setup
backend2/workers/webhookWorker.ts   ← Worker Thread
backend2/models/WebhookDelivery.ts  ← delivery log
```

### Code to write

```typescript
// backend2/workers/webhookQueue.ts
import { Queue, Worker } from "bullmq";
import { redisConnection } from "../config/redis";

export const webhookQueue = new Queue("webhook-delivery", {
  connection: redisConnection,
});

new Worker("webhook-delivery", async (job) => {
  const { appId, transactionId, callbackUrl, amount, currency } = job.data;

  // sign payload
  const payload = { appId, transactionId, amount, currency };
  const signature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SIGNING_SECRET!)
    .update(JSON.stringify(payload))
    .digest("hex");

  // POST to app callbackUrl
  const response = await fetch(callbackUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paygate-signature": signature,
    },
    body: JSON.stringify(payload),
  });

  // log delivery
  await WebhookDelivery.create({
    appId,
    transactionId,
    targetUrl: callbackUrl,
    payload,
    signature,
    attempt: job.attemptsMade + 1,
    status: response.ok ? "success" : "failed",
    responseCode: response.status,
    sentAt: new Date(),
  });

  if (!response.ok) throw new Error(`Delivery failed: ${response.status}`);

}, {
  connection: redisConnection,
  attempts: 3,
  backoff: { type: "exponential", delay: 30000 }, // 30s, 60s, 120s
});
```

### Template Method pattern — refactor after building
```typescript
// BaseProcessor enforces order — can't skip steps
abstract class BaseWebhookProcessor {
  async process(data: any) {
    await this.validate(data)   // step 1 — always runs
    await this.sign(data)       // step 2 — always runs
    await this.deliver(data)    // step 3 — always runs
    await this.log(data)        // step 4 — always runs
  }
  abstract validate(data: any): Promise<void>
  abstract sign(data: any): Promise<void>
  abstract deliver(data: any): Promise<void>
  abstract log(data: any): Promise<void>
}

class RazorpayWebhookProcessor extends BaseWebhookProcessor {
  async validate(data: any) { /* check required fields */ }
  async sign(data: any)     { /* HMAC sign */ }
  async deliver(data: any)  { /* POST to callbackUrl */ }
  async log(data: any)      { /* save WebhookDelivery */ }
}
```

### What to learn this week
```
1. BullMQ
   → Queue — add jobs
   → Worker — process jobs
   → attempts + backoff — retry config
   → job lifecycle — waiting, active, completed, failed

2. Worker Threads
   → isMainThread check
   → workerData — pass data in
   → parentPort.postMessage — send result back
   → keeps event loop free for HTTP requests

3. Template Method pattern
   → abstract class defines the skeleton
   → subclasses fill in the steps
   → order of steps is locked — can't be changed
   → real use: every payment provider follows same flow
```

---

## Week 7 — Analytics Routes + Repository Pattern

### What to build
```
backend1/routes/app.analytics_routes.ts
backend1/controller/app.analytics.ts
backend1/services/analytics.service.ts   ← aggregation pipelines
```

### Code to write

```typescript
// analytics.service.ts

// Daily volume
export const getDailyVolume = async (appId: string, days: number) => {
  return Transaction.aggregate([
    {
      $match: {
        appId: new mongoose.Types.ObjectId(appId),
        status: "paid",
        paidAt: { $gte: new Date(Date.now() - days * 86400000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" }},
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Method breakdown — UPI vs card vs netbanking
export const getMethodBreakdown = async (appId: string) => {
  return Transaction.aggregate([
    { $match: { appId: new mongoose.Types.ObjectId(appId), status: "paid" } },
    { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$amount" } } },
    { $sort: { total: -1 } }
  ]);
};

// Top failure reasons
export const getFailureReasons = async (appId: string) => {
  return Transaction.aggregate([
    { $match: { appId: new mongoose.Types.ObjectId(appId), status: "failed" } },
    { $group: { _id: "$failureReason", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
};
```

### Repository pattern — refactor after building
```typescript
// Before — queries scattered in controllers
Transaction.find({ appId, status: "paid" })

// After — one place for all DB queries
class TransactionRepository {
  findByApp(appId: string) {
    return Transaction.find({ appId })
  }
  findPaid(appId: string) {
    return Transaction.find({ appId, status: "paid" })
  }
  dailyVolume(appId: string, days: number) {
    return Transaction.aggregate([...])
  }
  methodBreakdown(appId: string) {
    return Transaction.aggregate([...])
  }
}

// controller uses repository, never touches model directly
const repo = new TransactionRepository()
const paid = await repo.findPaid(appId)
```

### What to learn this week
```
1. MongoDB aggregation pipeline
   → $match   — filter documents
   → $group   — group + calculate
   → $sort    — order results
   → $project — shape output
   → $lookup  — join collections
   → $limit   — top N results

2. explain() — find slow queries
   Transaction.find({ appId }).explain("executionStats")
   → IXSCAN = index used = fast
   → COLLSCAN = no index = slow = fix it

3. Repository pattern
   → single source of all DB queries
   → controller never imports model directly
   → swap MongoDB for anything — zero controller changes
```

---

## Week 8 — Hardening + Proxy Pattern

### What to build
```
backend1/middleware/rateLimiter.ts    ← Redis sliding window
backend1/middleware/errorHandler.ts   ← centralized errors
backend1/utils/logger.ts             ← Pino structured logging
backend1/server.ts                   ← clustering
GET /health                          ← health endpoint
```

### Code to write

```typescript
// middleware/rateLimiter.ts — sliding window with Redis sorted set
export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const key = `ratelimit:${req.app._id}:${Math.floor(Date.now() / 60000)}`;
  const count = await redis.incr(key);
  await redis.expire(key, 60);

  if (count > 100) {
    return res.status(429).json({
      success: false,
      code: "RATE_LIMITED",
      message: "100 requests per minute exceeded"
    });
  }
  next();
};

// utils/logger.ts
import pino from "pino";
export const logger = pino({ level: "info" });
// usage: logger.info({ appId, orderId }, "payment created")
// usage: logger.error({ err, orderId }, "webhook failed")

// server.ts — clustering
import cluster from "cluster";
import os from "os";

if (cluster.isPrimary) {
  const cores = os.availableParallelism();
  for (let i = 0; i < cores; i++) cluster.fork();
  cluster.on("exit", () => cluster.fork()); // auto restart crashed worker
} else {
  startExpressServer(); // your existing app.listen
}

// health endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "payment-service", uptime: process.uptime() });
});
```

### Proxy pattern — the rate limiter IS the proxy
```typescript
// Proxy sits in front of real controller
// controls access — 429 before request ever hits business logic

class PaymentControllerProxy {
  constructor(private real: PaymentController) {}

  async createOrder(req: Request, res: Response) {
    // proxy checks first
    const allowed = await checkRateLimit(req.app._id)
    if (!allowed) return res.status(429).json({ code: "RATE_LIMITED" })

    // proxy passes to real controller
    return this.real.createOrder(req, res)
  }
}
```

### What to learn this week
```
1. Pino logging
   → structured JSON logs — machine readable
   → faster than Winston
   → log levels: trace, debug, info, warn, error, fatal
   → always log: appId, orderId, error details

2. Node.js clustering
   → one process per CPU core
   → each worker has own event loop
   → Redis shared state across all workers
   → cluster.on("exit") = auto restart crashed worker

3. Rate limiting patterns
   → fixed window — simple, burst allowed at window edge
   → sliding window — smooth, more accurate
   → token bucket — allows controlled bursts
   → your Redis sorted set = sliding window

4. Proxy pattern
   → controls access to real object
   → rate limiter, auth, caching are all proxies
   → middleware chain IS a chain of proxies
```

---

## Week 9 — Docker + Singleton Audit

### What to build
```
backend1/Dockerfile
backend2/Dockerfile
docker-compose.yml   ← both services + MongoDB + Redis
.dockerignore
```

### Code to write

```dockerfile
# backend1/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: "3.9"
services:
  payment-service:
    build: ./backend1
    ports: ["3001:3001"]
    environment:
      - MONGODB_URI=mongodb://mongo:27017/paygate
      - REDIS_URL=redis://redis:6379
    depends_on: [mongo, redis]

  webhook-service:
    build: ./backend2
    ports: ["3002:3002"]
    environment:
      - MONGODB_URI=mongodb://mongo:27017/paygate_webhooks
      - REDIS_URL=redis://redis:6379
    depends_on: [redis]

  mongo:
    image: mongo:7
    volumes: [mongo_data:/data/db]

  redis:
    image: redis:7-alpine

volumes:
  mongo_data:
```

### Singleton audit this week
```typescript
// Every connection must be singleton — check all 3

// DB — created once
class Database {
  private static instance: mongoose.Connection
  static getInstance() {
    if (!this.instance) {
      this.instance = mongoose.createConnection(process.env.MONGODB_URI!)
    }
    return this.instance
  }
}

// Redis — created once
class RedisClient {
  private static instance: ReturnType<typeof createClient>
  static getInstance() {
    if (!this.instance) {
      this.instance = createClient({ url: process.env.REDIS_URL })
      this.instance.connect()
    }
    return this.instance
  }
}

// Razorpay — created once
class RazorpayClient {
  private static instance: Razorpay
  static getInstance() {
    if (!this.instance) {
      this.instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      })
    }
    return this.instance
  }
}
```

### What to learn this week
```
1. Docker
   → image vs container
   → Dockerfile — FROM, WORKDIR, COPY, RUN, CMD
   → docker build, docker run
   → .dockerignore — never copy node_modules

2. docker-compose
   → services, networks, volumes
   → depends_on — startup order
   → environment variables in compose

3. Singleton pattern
   → one instance for entire app lifetime
   → private constructor or static getInstance()
   → DB, Redis, external SDK clients = always singleton
   → creating new connection per request = connection exhaustion
```

---

## Week 10 — Deploy + Facade Pattern

### What to build
```
Railway deploy — backend1 + backend2
Postman collection — all endpoints
README.md — architecture diagram
Artillery load test
```

### Facade pattern — refactor createOrder
```typescript
// Before — controller does everything — 60 lines
export const createOrder = async (req, res) => {
  // validate
  // check idempotency
  // call razorpay
  // save transaction
  // return response
}

// After — Facade hides all complexity
class PaymentFacade {
  async createOrder(data: CreateOrderInput, appId: string) {
    // idempotency check
    const existing = await this.repo.findByIdempotencyKey(data.idempotencyKey)
    if (existing) return existing

    // create transaction
    const txn = await this.repo.create({ ...data, appId, status: "created" })

    // call razorpay
    const order = await this.gateway.createOrder(data.amount, data.currency)

    // save order id
    txn.razorpayOrderId = order.id
    await txn.save()

    return txn
  }
}

// controller is now 5 lines
export const createOrder = async (req: Request, res: Response) => {
  const result = CreateOrderSchema.safeParse(req.body)
  if (!result.success) return res.status(422).json({ errors: result.error })

  const data = await PaymentFacade.getInstance().createOrder(result.data, req.app._id)
  return res.status(201).json({ success: true, data })
}
```

### What to learn this week
```
1. Railway deployment
   → environment variables in Railway
   → health check endpoint required
   → PORT env var from Railway

2. Artillery load testing
   → config.yml — target, phases, scenarios
   → rps — requests per second
   → p99 latency — 99th percentile
   → find bottleneck → fix → test again

3. Facade pattern
   → hides subsystem complexity
   → controller stays thin
   → business logic moves to facade
   → easier to test — mock the facade
```

---

## Week 11 — Full OOP Refactor + Factory + Strategy

### Factory + Strategy — the big refactor
```typescript
// PaymentStrategy interface — every provider implements this
interface PaymentStrategy {
  createOrder(amount: number, currency: string): Promise<any>
  verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean>
  refund(paymentId: string, amount: number): Promise<any>
}

// RazorpayStrategy
class RazorpayStrategy implements PaymentStrategy {
  async createOrder(amount: number, currency: string) {
    return razorpay.orders.create({ amount, currency, receipt: Date.now().toString() })
  }
  async verifyPayment(orderId: string, paymentId: string, signature: string) {
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest("hex")
    return expected === signature
  }
  async refund(paymentId: string, amount: number) {
    return razorpay.payments.refund(paymentId, { amount })
  }
}

// GatewayFactory
class GatewayFactory {
  private static instances = new Map<string, PaymentStrategy>()

  static create(provider: string): PaymentStrategy {
    if (!this.instances.has(provider)) {
      if (provider === "razorpay") this.instances.set(provider, new RazorpayStrategy())
      // if (provider === "stripe") this.instances.set(provider, new StripeStrategy())
      else throw new Error(`Unknown provider: ${provider}`)
    }
    return this.instances.get(provider)!
  }
}

// Usage in PaymentFacade
const gateway = GatewayFactory.create(process.env.PAYMENT_PROVIDER!)
const order = await gateway.createOrder(amount, currency)
```

### What to learn this week
```
1. Factory pattern
   → creates objects without exposing creation logic
   → caller says "give me a razorpay gateway"
   → factory decides which class to instantiate
   → adding Stripe = add StripeStrategy, update factory — nothing else

2. Strategy pattern
   → defines family of algorithms (payment providers)
   → each in its own class
   → interchangeable at runtime
   → open/closed principle — open for extension, closed for modification

3. SOLID principles — know all 5
   S → Single Responsibility — one class, one job
   O → Open/Closed — extend without modifying
   L → Liskov Substitution — subclass can replace parent
   I → Interface Segregation — small interfaces, not fat ones
   D → Dependency Inversion — depend on abstractions not concretions
```

---

## Week 12 — System Design Practice

### One problem per week — forever
```
Week 12   Design PayGate itself
          → you built it, now explain it
          → boxes, arrows, data flow, failure modes

Week 13   Design a rate limiter
          → token bucket vs sliding window
          → Redis implementation
          → distributed — multiple servers

Week 14   Design a job queue
          → producer, consumer, retry, dead letter
          → exactly BullMQ — you built this

Week 15   Design a notification system
          → pub/sub, fan-out, delivery guarantees
          → Redis + Worker Threads — you built this

Week 16   Design URL shortener
          → hashing, redirect, analytics
          → MongoDB + Redis cache

Week 17   Design API gateway
          → auth, rate limit, routing, load balance
          → your middleware chain IS an API gateway
```

### Framework for every system design question
```
1. Clarify        → scale? read heavy or write heavy? consistency needed?
2. Estimate       → requests/sec, storage, bandwidth
3. High level     → boxes and arrows — services, DB, cache, queue
4. Deep dive      → pick the interesting component, go deep
5. Bottlenecks    → what breaks at 10x? how to fix?
```

### Resources — in order
```
1. ByteByteGo — Alex Xu YouTube    → visual, clear, start here
2. Gaurav Sen YouTube              → Indian creator, system design specific
3. "Designing Data Intensive Apps" → Martin Kleppmann — read after basics
4. PayGate itself                  → you can explain a real payment system
```

---


```
Level 1 — you are here
  → CRUD operations
  → Schema design with Mongoose
  → Basic indexes
  → Transactions with sessions

Level 2 — Week 7 onwards
  → Aggregation pipeline deeply
      $match, $group, $sort, $project, $lookup, $unwind
  → Compound indexes — { appId: 1, createdAt: -1 }
  → Partial indexes — only index paid transactions
  → TTL indexes — auto delete old sessions after X seconds
  → Explain plans — IXSCAN vs COLLSCAN

Level 3 — after deploy
  → Replica sets — primary + secondaries
  → Read preference — secondary for analytics
  → Write concern — majority for payments
  → Read concern — snapshot for transactions
  → Sharding — horizontal scaling
  → Change streams — react to DB changes in real time

Practice:
  → Build all 5 analytics routes using aggregation
  → Run explain() on every query — fix COLLSCAN
  → Add missing indexes — see speed difference
```

---

## Deep Learning — Redis

```
Level 1 — Week 5
  → pub/sub — publish, subscribe
  → basic set/get/del
  → TTL with setex

Level 2 — Week 8
  → Sorted sets — sliding window rate limiter
      ZADD, ZCOUNT, ZREMRANGEBYSCORE
  → Hashes — store objects
      HSET, HGET, HGETALL
  → Lists — simple queues
      LPUSH, RPOP, LRANGE

Level 3 — after deploy
  → Distributed locks — SET NX EX (Redlock)
  → Redis Streams — more powerful than pub/sub
  → Pipeline — batch multiple commands
  → Lua scripts — atomic multi-step operations
  → Redis cluster — horizontal scaling

Practice:
  → Implement rate limiter with sorted set
  → Cache /account/summary with hash
  → Implement distributed lock for webhook processing
```

---

## Deep Learning — Node.js

```
Level 1 — now
  → Express middleware chain
  → async/await error handling
  → environment variables

Level 2 — Week 8
  → Event loop — call stack, task queue, microtask queue
  → What blocks the event loop — CPU work, sync operations
  → Worker Threads — CPU work off main thread
  → Cluster — multiple processes, one port
  → Streams — large files without memory blow-up

Level 3 — after deploy
  → Memory profiling — find leaks
  → CPU profiling — find bottlenecks
  → --inspect flag — Chrome DevTools for Node
  → process.nextTick vs setImmediate vs setTimeout
  → Uncaught exception + unhandled rejection handlers

Practice:
  → Add clustering to server.ts
  → Move HMAC signing to Worker Thread
  → Stream large ledger export as CSV
```

---

## Interview Checklist — before applying

```
Can explain without notes:
  ✅ PayGate full architecture — services, DB, Redis, queue
  ✅ Why two services — separation of concerns
  ✅ Why Redis not HTTP between services — async decoupling
  ✅ How idempotency works — unique index + 11000 catch
  ✅ Why withTransaction not manual startTransaction — retry logic
  ✅ How HMAC verification works — incoming and outgoing
  ✅ What balanceBefore/After is and why order matters
  ✅ What upsert does and when not to use it
  ✅ How rate limiting works — Redis sliding window
  ✅ What clustering gives you — and what Redis solves across workers
  ✅ Every pattern used — Observer, Proxy, Factory, Strategy, Facade, Template, Singleton

Can whiteboard:
  ✅ PayGate architecture diagram
  ✅ Payment flow — app → backend1 → Razorpay → webhook → Redis → backend2 → app
  ✅ Rate limiter design
  ✅ Job queue design

Can answer:
  ✅ What breaks at 10x scale
  ✅ How to add Stripe with zero changes to controllers
  ✅ What happens if Redis goes down
  ✅ What happens if backend2 goes down
  ✅ How to debug a slow query in MongoDB
```

---

*PayGate v1.0 — Build plan. One week at a time. Finish before adding anything new.*
