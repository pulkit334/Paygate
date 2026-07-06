# Payment System — Complete Source Code

## Architecture Overview

```
Frontend (x-api-key header)
  → ApiGateway ApiKeyMiddleware
    → validates against App.publicKey in DB
    → sets req.app._id = appId

Controller (gRPC)
  └→ call.request.appId
       ↓
PaymentService.initiatePayment(data, appId)
  └→ Transaction.create({ appId, ... })
  └→ GatewayFactory.getGateway(type, appId)
       ↓
GatewayFactory (Singleton)
  └→ new RazerPayProvider(appId)
  └→ new PaymentGatewayProxy(provider, 5)
       ↓
PaymentGatewayProxy (Retry + Backoff + Timeout + Error Logging)
  └→ withTimeout(gateway.processPayment, 30s)
  └→ isRetryable() skips non-retryable errors
       ↓
BaseTemplate (Template Method)
  └→ validate(data) → initiate(data) → confirm(order)
       ↓
RazerPayProvider
  └→ config/razerpay.ts → RazerPayService.GetInstance(appId)
  └→ ProviderKey.findOne({ appId, provider: "razorpay" })
  └→ new Razorpay({ key_id, key_secret })
  └→ razorpay.orders.create({ amount * 100, currency, receipt })
       ↓
PaymentService returns { transactionId, providerOrderId, amount, currency }
  ↓
Controller → ApiGateway → Frontend
  └→ Frontend opens Razorpay checkout modal with orderId
```

---

## File Structure

```
backend1/
├── Interfaces/
│   └── paymentgateway.ts
├── types/
│   ├── GatewayTypes.ts
│   └── PaymentTypes.ts
├── models/
│   ├── transction.ts
│   ├── providerKey.ts
│   └── ledgerentry.ts
├── config/
│   ├── razerpay.ts
│   ├── database.ts
│   └── redis.ts
├── Engine/
│   ├── PaymentEngine.ts
│   ├── BaseTemplate.ts
│   ├── Proxy/
│   │   └── PaymentGatewayProxy.ts
│   ├── key/
│   │   └── provider.ts
│   └── providers/
│       └── RazerPay.ts
├── services/
│   └── app.PaymentService.ts
├── controller/
│   ├── app.payment.ts
│   ├── app.webhook.ts
│   ├── app.analytics.ts
│   ├── app.ledger.ts
│   └── app.payment-setting.ts
├── schema/
│   └── app.payment_schema.ts
├── proto/
│   └── payment.proto
└── server.ts

ApiGateway/
├── GrpcRef/
│   └── Grpc.ts
├── Middleware/
│   ├── validate_APi_Key.ts
│   └── jwtAuth.ts
├── Routes/
│   ├── PaymentRoutes.ts
│   ├── webhookRoutes.ts
│   ├── AnalyticsRoutes.ts
│   ├── ProviderKeyRoutes.ts
│   ├── ApiKeyRoutes.ts
│   └── MerhcantRoutes.ts
└── server.ts
```

---

## backend1 — Full Source Code

### Interfaces/paymentgateway.ts
```typescript
export interface IPaymentGateway {
  processPayment(data: any, appId: string): Promise<any>;
}
```

### types/GatewayTypes.ts
```typescript
export enum GatewayType {
  PAYTM = "PAYTM",
  RAZORPAY = "RAZORPAY",
  STRIPE = "STRIPE",
  MOCK = "MOCK",
}
```

### types/PaymentTypes.ts
```typescript
export interface PaymentData {
  amount: number;
  currency: string;
  receipt: string;
}

export interface PaymentResponse {
  orderId: string;
  amount: number;
  currency: string;
  status: string;
}
```

### models/transction.ts
```typescript
import mongoose, { Schema, Model } from "mongoose";

export interface ITransaction {
  appId: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPayId?: string;
  idempotencyKey: string;
  amount: number;
  currency: string | unknown;
  status: "created" | "paid" | "failed" | "refunded";
  Provider?: string;
  paymentMethod?: string;
  callbackUrl?: string;
  customerEmail?: string;
  metadata?: Record<string, unknown>;
  failureReason?: string;
  paidAt?: Date;
  customerName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    appId: {
      type: mongoose.Types.ObjectId,
      ref: "App",
      required: true,
    },
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    razorpayPayId: {
      type: String,
      sparse: true,
      unique: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["INR", "USD"],
      required: true,
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
    },
    Provider: {
      type: String,
    },
    callbackUrl: {
      type: String,
    },
    paymentMethod: { type: String },
    customerEmail: { type: String },
    customerName: { type: String },
    metadata: { type: Schema.Types.Mixed },
    failureReason: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

transactionSchema.index({ appId: 1 });
transactionSchema.index({ idempotencyKey: 1 }, { unique: true });

const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema,
);

export default Transaction;
```

### models/providerKey.ts
```typescript
import mongoose, { Schema, Model } from "mongoose";

export interface IProviderKey {
  appId: mongoose.Types.ObjectId;
  provider: string;
  keyId: string;
  keySecret: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const providerKeySchema = new Schema<IProviderKey>(
  {
    appId: {
      type: mongoose.Types.ObjectId,
      ref: "App",
      required: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ["razorpay", "stripe"],
    },
    keyId: {
      type: String,
      required: true,
    },
    keySecret: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

providerKeySchema.index({ appId: 1, provider: 1 }, { unique: true });

const ProviderKey: Model<IProviderKey> = mongoose.model<IProviderKey>(
  "ProviderKey",
  providerKeySchema,
);

export default ProviderKey;
```

### models/ledgerentry.ts
```typescript
import mongoose, { Schema, Model } from "mongoose";

export interface ILedger {
  transactionId: string;
  appId: mongoose.Types.ObjectId;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerSchema = new Schema<ILedger>(
  {
    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "App",
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      default: 0,
    },
    description: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

LedgerSchema.index({ appId: 1 });
LedgerSchema.index({ transactionId: 1 }, { unique: true });

const TransactionLedger: Model<ILedger> = mongoose.model<ILedger>(
  "Ledger",
  LedgerSchema,
);

export default TransactionLedger;
```

### config/razerpay.ts
```typescript
import Razorpay from "razorpay";
import RazerPayService from "../Engine/key/provider";

const instance = async (appId: string) => {
  const keys = await RazerPayService.GetInstance(appId);
  return new Razorpay({
    key_id: keys.Key_id,
    key_secret: keys.secretKey,
  });
};

export default instance;
```

### Engine/PaymentEngine.ts
```typescript
import { GatewayType } from "../types/GatewayTypes";
import { RazerPayProvider } from "./providers/RazerPay";
import { PaymentGatewayProxy } from "./Proxy/PaymentGatewayProxy";
import { IPaymentGateway } from "../Interfaces/paymentgateway";

export class GatewayFactory {
  private static instance: GatewayFactory;

  private constructor() {}

  static getInstance(): GatewayFactory {
    if (!GatewayFactory.instance) {
      GatewayFactory.instance = new GatewayFactory();
    }
    return GatewayFactory.instance;
  }

  getGateway(type: GatewayType, appId: string): IPaymentGateway {
    switch (type) {
      case GatewayType.RAZORPAY:
        const RealProvider = new RazerPayProvider(appId);
        const ProxyFactory = new PaymentGatewayProxy(RealProvider, 5);
        return ProxyFactory;
      case GatewayType.PAYTM:
      case GatewayType.STRIPE:
        throw new Error(
          `[GatewayFactory] Provider ${type} is registered but not implemented.`,
        );
      default:
        throw new Error(
          `[GatewayFactory] Fatal: Unsupported gateway type: ${type}`,
        );
    }
  }
}
```

### Engine/BaseTemplate.ts
```typescript
import { IPaymentGateway } from "../Interfaces/paymentgateway";

export abstract class BaseTemplate implements IPaymentGateway {
  constructor() {}
  async processPayment(data: any, appId: string): Promise<any> {
    await this.validate(data);
    const order = await this.initiate(data);
    return await this.confirm(order);
  }

  protected abstract validate(data: any): Promise<void>;
  protected abstract initiate(data: any): Promise<any>;
  protected abstract confirm(data: any): Promise<any>;
}
```

### Engine/Proxy/PaymentGatewayProxy.ts
```typescript
import { IPaymentGateway } from "../../Interfaces/paymentgateway";

const NON_RETRYABLE_MESSAGES = [
  "Invalid amount",
  "Currency is required",
  "Receipt ID is required",
  "Razorpay Key ID not configured",
  "Razorpay Secretkey ID not configured",
];

const GATEWAY_TIMEOUT_MS = 30000;

function isRetryable(error: any): boolean {
  const msg = error?.message || "";
  return !NON_RETRYABLE_MESSAGES.some((m) => msg.includes(m));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export class PaymentGatewayProxy implements IPaymentGateway {
  private RealGateway: IPaymentGateway;
  private maxRetries: number;

  constructor(gateway: IPaymentGateway, maxRetries = 3) {
    this.RealGateway = gateway;
    this.maxRetries = maxRetries;
  }

  public async processPayment(data: any, appId: string): Promise<any> {
    let attempt = 0;
    let cap = 10000;
    while (attempt < this.maxRetries) {
      try {
        attempt++;
        return await withTimeout(
          this.RealGateway.processPayment(data, appId),
          GATEWAY_TIMEOUT_MS,
          "Gateway call",
        );
      } catch (error: any) {
        if (!isRetryable(error) || attempt >= this.maxRetries) {
          throw error;
        }

        const baseDelay = 1000;
        const exponentialvalue = baseDelay * Math.pow(2, attempt);
        const currentCeiling = Math.min(cap, exponentialvalue);
        const totalWaitTime = Math.floor(Math.random() * currentCeiling);

        console.log(
          `[Proxy Shield] Attempt ${attempt} failed. Retrying in ${totalWaitTime}ms...`,
        );

        await new Promise((r) => setTimeout(r, totalWaitTime));
      }
    }
    throw new Error("Unexpected Proxy Failure");
  }
}
```

### Engine/key/provider.ts
```typescript
import ProviderKey from "../../models/providerKey";

class RazerPayService {
  static async getKeyId(appId: string): Promise<string> {
    const key = await ProviderKey.findOne({
      appId,
      provider: "razorpay",
      isActive: true,
    });
    if (!key) throw new Error("Razorpay Key ID not configured");
    return key.keyId;
  }

  static async GetKeySecret(appId: string): Promise<string> {
    const key = await ProviderKey.findOne({
      appId,
      provider: "razorpay",
      isActive: true,
    })
      .select("keySecret")
      .lean();
    if (!key) throw new Error("Razorpay Secretkey ID not configured");
    return key.keySecret;
  }

  static async GetInstance(appId: string) {
    const [Key_id, secretKey] = await Promise.all([
      this.getKeyId(appId),
      this.GetKeySecret(appId),
    ]);
    return { Key_id, secretKey };
  }
}

export default RazerPayService;
```

### Engine/providers/RazerPay.ts
```typescript
import instance from "../../config/razerpay";
import { PaymentData, PaymentResponse } from "../../types/PaymentTypes";
import { BaseTemplate } from "../BaseTemplate";

export class RazerPayProvider extends BaseTemplate {
  private appId: string;

  constructor(appId: string) {
    super();
    this.appId = appId;
  }

  protected async validate(data: PaymentData): Promise<void> {
    if (!data.amount || data.amount <= 0) {
      throw new Error("[Razorpay] Invalid amount provided.");
    }
    if (!data.currency) {
      throw new Error("[Razorpay] Currency is required.");
    }
    if (!data.receipt) {
      throw new Error("[Razorpay] Receipt ID is required.");
    }
  }

  protected async initiate(data: PaymentData): Promise<Record<string, unknown>> {
    try {
      const razorpay = await instance(this.appId);
      const order = await razorpay.orders.create({
        amount: data.amount * 100,
        currency: data.currency,
        receipt: data.receipt,
      });
      return order as unknown as Record<string, unknown>;
    } catch (error: any) {
      throw new Error(`[Razorpay] Failed to initiate order: ${error.message || error}`);
    }
  }

  protected async confirm(order: Record<string, unknown>): Promise<PaymentResponse> {
    return {
      orderId: String(order.id),
      amount: Number(order.amount) / 100,
      currency: String(order.currency),
      status: String(order.status),
    };
  }
}
```

### services/app.PaymentService.ts
```typescript
import { GatewayType } from "../types/GatewayTypes";
import Transaction from "../models/transction";
import { PaymentData } from "../types/PaymentTypes";
import { GatewayFactory } from "../Engine/PaymentEngine";
import crypto from "crypto";
import RazerPayService from "../Engine/key/provider";

export class PaymentService {
  static async initiatePayment(PaymentData: any, appId: string) {
    const {
      amount,
      currency,
      metadata,
      idempotencyKey,
      customerName,
      customerEmail,
      Provider,
    } = PaymentData;

    try {
      let newTransaction;
      try {
        newTransaction = await Transaction.create({
          appId,
          amount,
          currency: currency || "INR",
          customerEmail,
          customerName,
          metadata,
          idempotencyKey,
          Provider,
          status: "created",
        });
      } catch (err: any) {
        if (err.code === 11000) {
          return await Transaction.findOne({ idempotencyKey });
        }
        throw err;
      }

      const targetGateway = Provider
        ? (Provider as GatewayType)
        : GatewayType.RAZORPAY;
      const factory = GatewayFactory.getInstance();
      const paymentEngine = factory.getGateway(targetGateway, appId);
      const paymentPayload: PaymentData = {
        amount: amount,
        currency: newTransaction.currency as string,
        receipt: newTransaction._id.toString(),
      };
      const gatewayResponse =
        await paymentEngine.processPayment(paymentPayload, appId);

      newTransaction.razorpayOrderId = gatewayResponse.orderId;
      await newTransaction.save();
      return {
        transactionId: newTransaction._id,
        providerOrderId: gatewayResponse.orderId,
        amount: newTransaction.amount,
        currency: newTransaction.currency,
        providerUsed: targetGateway,
      };
    } catch (error: any) {
      throw new Error(`Service Failure: ${error.message}`);
    }
  }

  static async VerifyPayment(verificationData: any, appId: string) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      verificationData;

    const transaction = await Transaction.findOne({
      razorpayOrderId: razorpay_order_id,
      appId,
    });
    if (!transaction) {
      return { success: false, message: "Transaction not found" };
    }

    const keySecret = await RazerPayService.GetKeySecret(appId);
    const GeneratedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    if (GeneratedSignature !== razorpay_signature) {
      throw new Error("Fraud detected: Invalid signature");
    }

    if ((transaction.status as string) === "paid") {
      return {
        success: true,
        status: "paid",
        message: "Payment verified and Ledger is already updated.",
      };
    }

    transaction.razorpayPayId = razorpay_payment_id;
    await transaction.save();

    return {
      success: true,
      status: "processing",
      message: "Signature verified securely. Safe to show success screen.",
    };
  }
}
```

### controller/app.payment.ts
```typescript
import * as z from "zod";
import { CreateOrderSchema } from "../schema/app.payment_schema";
import { PaymentService } from "../services/app.PaymentService";
import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";
import Transaction from "../models/transction";

export const createOrder = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  const result = CreateOrderSchema.safeParse(call.request);
  if (!result.success) {
    const error = z.flattenError(result.error).fieldErrors;
    return callback({
      code: status.INVALID_ARGUMENT,
      message: `Validation Failed: ${JSON.stringify(error)}`,
    });
  }

  const appId = call.request.appId;

  try {
    const PaymentResponse = await PaymentService.initiatePayment(
      result.data as any,
      appId,
    );

    if (!PaymentResponse) {
      return callback({
        code: status.NOT_FOUND,
        message: "Payment could not be initiated",
      });
    }
    const response = PaymentResponse as any;

    return callback(null, {
      success: true,
      orderId: response.providerOrderId,
      amount: response.amount,
      currency: response.currency,
      status: "created",
      createdAt: new Date().toISOString(),
      error: "",
    });
  } catch (error: any) {
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal Server Error",
    });
  }
};

export const VerifyOrder = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const appId = call.request.app._id;
    const result = await PaymentService.VerifyPayment(call.request, appId);

    if (!result) {
      return callback({
        code: status.NOT_FOUND,
        message: "Payment verification failed",
      });
    }

    return callback(null, {
      success: true,
      status: "verified",
      message: "Signature verified securely. Safe to show success screen.",
      error: "",
    });
  } catch (error: any) {
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal Server Error",
    });
  }
};

export const GetTransaction = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  const appId = call.request.appId;
  const { from, to, limit = 50, offset = 0 } = call.request;

  try {
    const query: any = { appId };

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to + "T23:59:59.999Z");
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    return callback(null, {
      success: true,
      transactions: transactions.map((t) => ({
        transactionId: t._id.toString(),
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        customerEmail: t.customerEmail,
        customerName: t.customerName,
        razorpayOrderId: t.razorpayOrderId,
        razorpayPayId: t.razorpayPayId || "",
        provider: t.Provider || "",
        createdAt: t.createdAt?.toISOString() || "",
      })),
      total,
    });
  } catch (error: any) {
    return callback({
      code: status.INTERNAL,
      message: error.message || "Failed to fetch transactions",
    });
  }
};
```

### controller/app.webhook.ts
```typescript
import crypto from "crypto";
import mongoose from "mongoose";
import Transaction from "../models/transction";
import TransactionLedger from "../models/ledgerentry";
import { redisClient } from "../config/redis";
import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";

const payWebhook = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    // 1. Verify HMAC signature
    const signature = call.request.signature as string;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET as string)
      .update(JSON.stringify(call.request.body))
      .digest("hex");

    if (signature !== expectedSignature) {
      return callback({
        code: status.UNAUTHENTICATED,
        message: "Invalid signature",
      });
    }

    // 2. Only handle payment.captured
    const event = call.request.body.event;
    if (event !== "payment.captured") {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "Unauthorized event type",
      });
    }

    // 3. Extract payment details
    const razorpayOrderId: string =
      call.request.body.payload.payment.entity.order_id;
    const razorpayPayId: string = call.request.body.payload.payment.entity.id;
    const amountPaise: number = call.request.body.payload.payment.entity.amount;
    const currency: string = call.request.body.payload.payment.entity.currency;

    // 4. Transactional DB writes
    let appId: string = "";
    let callbackUrl: string = "";

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // 4a. Find transaction
        const txn = await Transaction.findOne({ razorpayOrderId }).session(
          session,
        );

        if (!txn) {
          throw new Error(
            `Transaction not found for orderId: ${razorpayOrderId}`,
          );
        }

        // 4b. Idempotency
        if (txn.status === "paid") {
          return;
        }

        appId = txn.appId.toString();
        callbackUrl = txn.callbackUrl ?? "";

        // 4c. Read Balance Before
        const AccountLedger = await TransactionLedger.findOne({
          appId: txn.appId,
        })
          .session(session)
          .sort({ createdAt: -1 });
        const balanceBefore = AccountLedger?.balanceBefore ?? 0;
        const balanceAfter = Number(balanceBefore) + amountPaise;

        // 4d. Mark transaction paid
        txn.status = "paid";
        txn.razorpayPayId = razorpayPayId;
        txn.paidAt = new Date();
        await txn.save({ session });

        // 4e. Create ledger entry
        await TransactionLedger.create(
          [
            {
              appId: txn.appId,
              transactionId: txn._id.toString(),
              amount: amountPaise,
              balanceBefore,
              balanceAfter,
              description: `Payment captured — order ${razorpayOrderId}`,
            },
          ],
          { session },
        );

        // 4f. Account summary via Redis stream
        await redisClient.xadd(
          "AccountSummaryUpdate",
          "*",
          "appId",
          appId,
          "totalReceived",
          amountPaise,
          "totalTransactions",
          1,
          "successCount",
          1,
        );
      });
    } finally {
      await session.endSession();
    }

    // 5. Push to payment stream (non-blocking)
    redisClient
      .xadd(
        "payment.stream",
        "*",
        "appId",
        appId,
        "orderId",
        razorpayOrderId,
        "payId",
        razorpayPayId,
        "amount",
        amountPaise.toString(),
        "currency",
        currency,
        "callbackUrl",
        callbackUrl,
      )
      .catch((err) =>
        console.error("Redis payment.stream write failed:", err.message),
      );

    return callback(null, {
      success: true,
      message: "Webhook received and processed",
      error: "",
    });
  } catch (error: any) {
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal server error",
    });
  }
};

export default payWebhook;
```

### controller/app.analytics.ts
```typescript
import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";
import mongoose from "mongoose";
import Transaction from "../models/transction";

export const GetAnalyticsSummary = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { appId } = call.request;
    if (!appId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId is required",
      });
    }

    const [result] = await Transaction.aggregate([
      {
        $match: {
          appId: new mongoose.Types.ObjectId(appId),
          status: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalReceived: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
          lastPaymentAt: { $max: "$createdAt" },
        },
      },
    ]);

    const totalReceived = result?.totalReceived ?? 0;
    const totalTransactions = result?.totalTransactions ?? 0;
    const lastPaymentAt = result?.lastPaymentAt ?? null;
    const successRate = totalTransactions > 0 ? 100 : 0;

    callback(null, {
      totalReceived,
      totalTransactions,
      successRate,
      lastPaymentAt: lastPaymentAt ? lastPaymentAt.toISOString() : "",
    });
  } catch (err) {
    callback({
      code: status.INTERNAL,
      message: "Failed to fetch analytics summary",
    });
  }
};

export const DashboardAnalytics = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const appId = call.request.appId;
    if (!appId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId is required",
      });
    }
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 6);
    fromDate.setHours(0, 0, 0, 0);

    const TransactionResult = await Transaction.aggregate([
      {
        $match: {
          appId: new mongoose.Types.ObjectId(appId),
          createdAt: {
            $gte: fromDate,
            $lte: new Date(),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          amount: 1,
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    callback(null, { days: TransactionResult });
  } catch (err) {
    callback({
      code: status.INTERNAL,
      message: "Failed to fetch analytics",
    });
  }
};
```

### controller/app.ledger.ts
```typescript
import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";
import mongoose from "mongoose";
import TransactionLedger from "../models/ledgerentry";

export const GetLedger = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { appId } = call.request;
    if (!appId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId is required",
      });
    }

    const latestEntry = await TransactionLedger.findOne({
      appId: new mongoose.Types.ObjectId(appId),
    }).sort({ createdAt: -1 });

    if (!latestEntry) {
      return callback(null, {
        success: true,
        amount: 0,
        balanceBefore: 0,
        balanceAfter: 0,
        description: "No ledger entries",
        createdAt: "",
      });
    }

    callback(null, {
      success: true,
      amount: latestEntry.amount,
      balanceBefore: latestEntry.balanceBefore,
      balanceAfter: latestEntry.balanceAfter,
      description: latestEntry.description || "",
      createdAt: latestEntry.createdAt.toISOString(),
    });
  } catch (err) {
    callback({
      code: status.INTERNAL,
      message: "Failed to fetch ledger",
    });
  }
};
```

### controller/app.payment-setting.ts
```typescript
import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";
import ProviderKey from "../models/providerKey";

export const UpdateProviderKey = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { appId, provider, keyId, keySecret } = call.request;

    if (!appId || !provider || !keyId || !keySecret) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId, provider, keyId, and keySecret are required",
      });
    }

    const existing = await ProviderKey.findOne({ appId, provider });

    if (existing) {
      existing.keyId = keyId;
      existing.keySecret = keySecret;
      existing.isActive = true;
      await existing.save();
    } else {
      await ProviderKey.create({ appId, provider, keyId, keySecret, isActive: true });
    }

    callback(null, { success: true, message: `${provider} keys updated successfully` });
  } catch (err: any) {
    callback({
      code: status.INTERNAL,
      message: err.message || "Failed to update provider keys",
    });
  }
};

export const GetProviderKeys = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { appId } = call.request;

    if (!appId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId is required",
      });
    }

    const keys = await ProviderKey.find({ appId }).select("-keySecret").sort({ createdAt: -1 });

    callback(null, {
      keys: keys.map((k) => ({
        provider: k.provider,
        keyId: k.keyId,
        isActive: k.isActive,
        createdAt: k.createdAt?.toISOString() || "",
      })),
    });
  } catch (err: any) {
    callback({
      code: status.INTERNAL,
      message: err.message || "Failed to fetch provider keys",
    });
  }
};

export const DeleteProviderKey = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { appId, provider } = call.request;

    if (!appId || !provider) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId and provider are required",
      });
    }

    const deleted = await ProviderKey.findOneAndDelete({ appId, provider });

    if (!deleted) {
      return callback({
        code: status.NOT_FOUND,
        message: `No ${provider} keys found for this app`,
      });
    }

    callback(null, { success: true, message: `${provider} keys disconnected` });
  } catch (err: any) {
    callback({
      code: status.INTERNAL,
      message: err.message || "Failed to delete provider keys",
    });
  }
};
```

### proto/payment.proto
```protobuf
syntax = "proto3";

package paymentpackage;

service PaymentService {
  rpc CreateOrder (CreateOrderRequest) returns (CreateOrderResponse);
  rpc VerifyOrder (VerifyOrderRequest) returns (VerifyOrderResponse);
  rpc WebhookBody (PayWebhookRequest) returns (PayWebhookResponse);
  rpc GetTransctions (GetTransctionRequest) returns (GetTransctionResponse);
  rpc GetAnalyticsSummary (AnalyticsSummaryRequest) returns (AnalyticsSummaryResponse);
  rpc GetDailyVolume (DailyVolumeRequest) returns (DailyVolumeResponse);
  rpc UpdateProviderKey (UpdateProviderKeyRequest) returns (UpdateProviderKeyResponse);
  rpc GetProviderKeys (GetProviderKeysRequest) returns (GetProviderKeysResponse);
  rpc DeleteProviderKey (DeleteProviderKeyRequest) returns (DeleteProviderKeyResponse);
  rpc GetLedger (GetLedgerRequest) returns (GetLedgerResponse);
}

message CreateOrderRequest {
  string appId = 1;
  double amount = 2;
  string currency = 3;
  string receipt = 4;
  string notes = 5;
  string customerName = 6;
  string idempotencyKey = 7;
  string Provider = 8;
  string customoreEmail = 9;
  string metadata = 10;
}

message CreateOrderResponse {
  bool success = 1;
  string orderId = 2;
  double amount = 3;
  string currency = 4;
  string receipt = 5;
  string status = 6;
  string createdAt = 7;
  string error = 8;
}

message VerifyOrderRequest {
  string appId = 1;
  string razorpay_order_id = 2;
  string razorpay_payment_id = 3;
  string razorpay_signature = 4;
}

message VerifyOrderResponse {
  bool success = 1;
  string status = 2;
  string message = 3;
  string error = 4;
}

message WebhookPaymentEntity {
  string order_id = 1;
  string id = 2;
  double amount = 3;
  string currency = 4;
}

message WebhookPayload {
  WebhookPaymentEntity payment = 1;
}

message WebhookBody {
  string event = 1;
  WebhookPayload payload = 2;
}

message PayWebhookRequest {
  string signature = 1;
  WebhookBody body = 2;
}

message PayWebhookResponse {
  bool success = 1;
  string message = 2;
  string error = 3;
}

message GetTransctionRequest {
  string appId = 1;
  string from = 2;
  string to = 3;
  int32 limit = 4;
  int32 offset = 5;
}

message GetTransctionResponse {
  bool success = 1;
  repeated TransactionItem transactions = 2;
  int32 total = 3;
}

message TransactionItem {
  string transactionId = 1;
  int32 amount = 2;
  string currency = 3;
  string status = 4;
  string customerEmail = 5;
  string customerName = 6;
  string razorpayOrderId = 7;
  string razorpayPayId = 8;
  string provider = 9;
  string createdAt = 10;
}

message AnalyticsSummaryRequest {
  string appId = 1;
}

message AnalyticsSummaryResponse {
  double totalReceived = 1;
  int32 totalTransactions = 2;
  double successRate = 3;
  string lastPaymentAt = 4;
}

message DailyVolumeRequest {
  string appId = 1;
  int32 days = 2;
}

message DailyVolumeItem {
  string date = 1;
  double amount = 2;
  int32 count = 3;
}

message DailyVolumeResponse {
  repeated DailyVolumeItem days = 1;
}

message UpdateProviderKeyRequest {
  string appId = 1;
  string provider = 2;
  string keyId = 3;
  string keySecret = 4;
}

message UpdateProviderKeyResponse {
  bool success = 1;
  string message = 2;
}

message GetProviderKeysRequest {
  string appId = 1;
}

message ProviderKeyItem {
  string provider = 1;
  string keyId = 2;
  bool isActive = 3;
  string createdAt = 4;
}

message GetProviderKeysResponse {
  repeated ProviderKeyItem keys = 1;
}

message DeleteProviderKeyRequest {
  string appId = 1;
  string provider = 2;
}

message DeleteProviderKeyResponse {
  bool success = 1;
  string message = 2;
}

message GetLedgerRequest {
  string appId = 1;
}

message GetLedgerResponse {
  bool success = 1;
  double amount = 2;
  double balanceBefore = 3;
  double balanceAfter = 4;
  string description = 5;
  string createdAt = 6;
}
```

### server.ts
```typescript
import express from "express";
import dotenv from "dotenv";
import "./config/redis";
import { ConnectDb } from "./config/database";
import * as grpc from "@grpc/grpc-js";
import * as protLoader from "@grpc/proto-loader";
dotenv.config();
import { createOrder, GetTransaction, VerifyOrder } from "./controller/app.payment";
import { DashboardAnalytics, GetAnalyticsSummary } from "./controller/app.analytics";
import { UpdateProviderKey, GetProviderKeys, DeleteProviderKey } from "./controller/app.payment-setting";
import { GetLedger } from "./controller/app.ledger";
import path from "path";

const PORT = process.env.PORT || 60001;

const PROTO_PATH = path.resolve(__dirname, "./proto/payment.proto");
const packageDefinition = protLoader.loadSync(PROTO_PATH) as any;
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const authPackage = protoDescriptor.paymentpackage;

const Server = new grpc.Server();

Server.addService(authPackage.PaymentService.service, {
  CreateOrder: createOrder,
  VerifyOrder: VerifyOrder,
  GetTransctions: GetTransaction,
  GetDailyVolume: DashboardAnalytics,
  GetAnalyticsSummary: GetAnalyticsSummary,
  UpdateProviderKey: UpdateProviderKey,
  GetProviderKeys: GetProviderKeys,
  DeleteProviderKey: DeleteProviderKey,
  GetLedger: GetLedger,
});

const startServer = async () => {
  await ConnectDb();

  Server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error(`Failed to bind: ${error.message}`);
        return;
      }
      console.log(`[Payment Service] gRPC Server listening on port ${port}`);
    },
  );
};

startServer();
```

---

## ApiGateway — Payment-Related Code Only

### GrpcRef/Grpc.ts
```typescript
import path from "path";
import { fileURLToPath } from "url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../../");

const GrpcPath = path.join(projectRoot, "backend/proto/merchant.proto");
const GRPCPaymentServicePath = path.join(projectRoot, "backend1/proto/payment.proto");

const packageDefinition = protoLoader.loadSync(GrpcPath, {});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

const packageDefinitionPaymentService = protoLoader.loadSync(GRPCPaymentServicePath, {});
const protoDescriptorPaymentone = grpc.loadPackageDefinition(packageDefinitionPaymentService) as any;

const merchantClient = new protoDescriptor.authpackage.MerchantAuth(
  "localhost:50001",
  grpc.credentials.createInsecure(),
);

const PaymentClient = new protoDescriptorPaymentone.paymentpackage.PaymentService(
  "localhost:50051",
  grpc.credentials.createInsecure(),
);

export { merchantClient, PaymentClient };
```

### Middleware/validate_APi_Key.ts
```typescript
import { NextFunction, Request, Response } from "express";
import { merchantClient } from "../GrpcRef/Grpc";
import AppError from "../utils/Error";

const ApiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      throw AppError.Validation("API key is required");
    }
    if (!apiKey.toLowerCase().startsWith("sk_live_")) {
      throw AppError.Validation("Invalid API key format");
    }

    merchantClient.ValidateApiKey({ apiKey }, (err: any, response: any) => {
      if (err) {
        return next(AppError.Service("Auth service unavailable"));
      }
      if (!response?.valid) {
        return next(AppError.Auth("Invalid API key", 401));
      }

      (req as any).app = {
        _id: response.appId,
        merchantId: response.merchantId,
      };

      next();
    });
  } catch (error) {
    next(error);
  }
};

export { ApiKeyMiddleware };
```

### Routes/PaymentRoutes.ts
```typescript
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { PaymentClient } from "../GrpcRef/Grpc";
import { ApiKeyMiddleware } from "../Middleware/validate_APi_Key";
import AppError from "../utils/Error";

const router = express.Router();

// POST /api/v2/create — Create Razorpay order (requires x-api-key)
router.post(
  "/create",
  ApiKeyMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      if (!req.body.amount) throw AppError.Validation("Amount is required");
      if (req.body.amount < 1) throw AppError.Validation("Amount must be greater than 0");
      if (!req.body.currency) throw AppError.Validation("Currency is required");

      const Grpcpayload = {
        appId: (req as any).app._id,
        amount: req.body.amount,
        currency: req.body.currency,
        customerName: req.body.customerName,
        metadata: req.body.metadata || "",
        idempotencyKey: req.body.idempotencyKey || crypto.randomUUID(),
        customoreEmail: req.body.customoreEmail,
        Provider: req.body.Provider,
      };

      PaymentClient.CreateOrder(Grpcpayload, (err: any, Response: any) => {
        if (err) return next(AppError.Payment(err.message));
        res.status(200).json(Response);
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v2/verify — Verify payment signature
router.post("/verify", async (req: Request, res: Response, next) => {
  try {
    if (!req.body.razorpay_order_id) throw AppError.Validation("razorpay_order_id is required");
    if (!req.body.razorpay_payment_id) throw AppError.Validation("razorpay_payment_id is required");
    if (!req.body.razorpay_signature) throw AppError.Validation("razorpay_signature is required");

    const GrpcPayLoad = {
      razorpay_order_id: req.body.razorpay_order_id,
      razorpay_payment_id: req.body.razorpay_payment_id,
      razorpay_signature: req.body.razorpay_signature,
    };

    PaymentClient.Verify(GrpcPayLoad, (err: any, Response: any) => {
      if (err) return next(AppError.Payment(err.message));
      res.status(200).json(Response);
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v2/transactions — List transactions (requires JWT)
router.get("/transactions", async (req: Request, res: Response, next) => {
  try {
    const appId = (req as any).merchant._id;
    if (!appId) throw AppError.Validation("Unauthorized");

    const { from, to, limit = "50", offset = "0" } = req.query;

    const grpcPayload = {
      appId,
      from: from || "",
      to: to || "",
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    };

    PaymentClient.GetTransctions(grpcPayload, (err: any, Response: any) => {
      if (err) return next(AppError.Payment(err.message));
      res.status(200).json(Response);
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v2/ledger — Get wallet balance (requires JWT)
router.get("/ledger", async (req: Request, res: Response, next) => {
  try {
    const appId = (req as any).merchant._id;
    if (!appId) throw AppError.Validation("Unauthorized");

    PaymentClient.GetLedger({ appId }, (err: any, Response: any) => {
      if (err) return next(AppError.Payment(err.message));
      res.status(200).json(Response);
    });
  } catch (err) {
    next(err);
  }
});

export default router;
```

### Routes/webhookRoutes.ts
```typescript
import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc";
import AppError from "../utils/Error";

const router = express.Router();

// POST /webhook/razorpay — Razorpay webhook receiver
router.post("/razorpay", async (req: Request, res: Response, next) => {
  try {
    if (!req.headers["x-razorpay-signature"]) {
      throw AppError.Validation("Missing x-razorpay-signature header");
    }
    if (!req.body) {
      throw AppError.Validation("Missing webhook body");
    }

    const result = await PaymentClient.payWebhook({
      signature: req.headers["x-razorpay-signature"],
      body: req.body,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(
      AppError.Webhook(
        error instanceof Error ? error.message : "Webhook processing failed",
      ),
    );
  }
});

export default router;
```

### Routes/AnalyticsRoutes.ts
```typescript
import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth";
import AppError from "../utils/Error";

const router = express.Router();

router.get(
  "/analytics/summary",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      PaymentClient.GetAnalyticsSummary({ appId }, (err: any, response: any) => {
        if (err) return next(AppError.Payment(err.message));
        res.status(200).json(response);
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/analytics/daily",
  JwtAuthMiddleware,
  async (req: Request, res: Response, next) => {
    try {
      const appId = (req as any).merchant._id;
      if (!appId) throw AppError.Validation("Unauthorized");

      const days = parseInt((req.query.days as string) || "7", 10);

      PaymentClient.GetDailyVolume({ appId, days }, (err: any, response: any) => {
        if (err) return next(AppError.Payment(err.message));
        res.status(200).json(response.days || []);
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
```

### Routes/ProviderKeyRoutes.ts
```typescript
import express, { Request, Response } from "express";
import { PaymentClient } from "../GrpcRef/Grpc";
import { JwtAuthMiddleware } from "../Middleware/jwtAuth";
import AppError from "../utils/Error";

const router = express.Router();

router.get("/provider-keys", JwtAuthMiddleware, async (req: Request, res: Response, next) => {
  try {
    const appId = (req as any).merchant._id;
    if (!appId) throw AppError.Validation("Unauthorized");

    PaymentClient.GetProviderKeys({ appId }, (err: any, response: any) => {
      if (err) return next(AppError.Payment(err.message));
      res.status(200).json(response);
    });
  } catch (error) {
    next(error);
  }
});

router.post("/provider-keys", JwtAuthMiddleware, async (req: Request, res: Response, next) => {
  try {
    const appId = (req as any).merchant._id;
    if (!appId) throw AppError.Validation("Unauthorized");

    const { provider, keyId, keySecret } = req.body;
    if (!provider || !keyId || !keySecret) {
      throw AppError.Validation("provider, keyId, and keySecret are required");
    }

    PaymentClient.UpdateProviderKey(
      { appId, provider, keyId, keySecret },
      (err: any, response: any) => {
        if (err) return next(AppError.Payment(err.message));
        res.status(200).json(response);
      },
    );
  } catch (error) {
    next(error);
  }
});

router.delete("/provider-keys/:provider", JwtAuthMiddleware, async (req: Request, res: Response, next) => {
  try {
    const appId = (req as any).merchant._id;
    if (!appId) throw AppError.Validation("Unauthorized");

    const { provider } = req.params;

    PaymentClient.DeleteProviderKey(
      { appId, provider },
      (err: any, response: any) => {
        if (err) return next(AppError.Payment(err.message));
        res.status(200).json(response);
      },
    );
  } catch (error) {
    next(error);
  }
});

export default router;
```

### server.ts (Gateway)
```typescript
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { RedisStore } from "rate-limit-redis";
import rateLimit from "express-rate-limit";
dotenv.config();
import AppError from "./utils/Error";
import MerchantRoutes from "./Routes/MerhcantRoutes";
import PaymentRoutes from "./Routes/PaymentRoutes";
import WebhookRoutes from "./Routes/webhookRoutes";
import WebhookHistoryRoutes from "./Routes/WebhookHistoryRoutes";
import ApiKeyRoutes from "./Routes/ApiKeyRoutes";
import AnalyticsRoutes from "./Routes/AnalyticsRoutes";
import ProviderKeyRoutes from "./Routes/ProviderKeyRoutes";
import { JwtAuthMiddleware } from "./Middleware/jwtAuth";
import { redisClient } from "./config/redis";

const app = express();

app.use("/webhook/razorpay", express.raw({ type: "application/json" }));

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => (redisClient as any).call(...args),
  }),
  message: { success: false, message: "Too many requests" },
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => (redisClient as any).call(...args),
  }),
  message: { success: false, message: "Too many payment requests" },
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1", generalLimiter, MerchantRoutes);
app.use("/api/v1/api-keys", JwtAuthMiddleware, ApiKeyRoutes);
app.use("/api/v2", paymentLimiter, JwtAuthMiddleware, PaymentRoutes);
app.use("/api/v2", JwtAuthMiddleware, WebhookHistoryRoutes);
app.use("/api/v2", AnalyticsRoutes);
app.use("/api/v2", ProviderKeyRoutes);
app.use("/webhook", WebhookRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      type: err.type,
    });
  }
  res.status(500).json({ error: "Internal server error" });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err.message);
  process.exit(1);
});

process.on("unhandledRejection", (message) => {
  console.error("Unhandled rejection:", message);
});

const PORT = process.env.PORT || 6283;
app.listen(PORT, () => {
  console.log(`ApiGateway listening on port ${PORT}`);
});
```

---

## API Route Summary

| Method | Route | Auth | Handler | Description |
|--------|-------|------|---------|-------------|
| POST | `/api/v2/create` | x-api-key | `PaymentClient.CreateOrder` | Create Razorpay order |
| POST | `/api/v2/verify` | none | `PaymentClient.Verify` | Verify payment signature |
| GET | `/api/v2/transactions` | JWT | `PaymentClient.GetTransctions` | List transactions |
| GET | `/api/v2/ledger` | JWT | `PaymentClient.GetLedger` | Wallet balance |
| GET | `/api/v2/analytics/summary` | JWT | `PaymentClient.GetAnalyticsSummary` | Summary stats |
| GET | `/api/v2/analytics/daily` | JWT | `PaymentClient.GetDailyVolume` | Daily volume chart |
| GET | `/api/v2/provider-keys` | JWT | `PaymentClient.GetProviderKeys` | List provider keys |
| POST | `/api/v2/provider-keys` | JWT | `PaymentClient.UpdateProviderKey` | Save provider keys |
| DELETE | `/api/v2/provider-keys/:provider` | JWT | `PaymentClient.DeleteProviderKey` | Remove provider key |
| POST | `/webhook/razorpay` | HMAC | `PaymentClient.payWebhook` | Razorpay webhook |

---

## Key Design Decisions

1. **BYOK (Bring Your Own Key)** — Users store their own Razorpay/Stripe keys in ProviderKey collection
2. **Async Key Fetch** — `config/razerpay.ts` is async because keys come from DB
3. **appId everywhere** — Each provider instance is scoped to one merchant's keys
4. **Single amount conversion** — Amount converted to paise only in `RazerPayProvider.initiate()` (`data.amount * 100`), raw rupees passed through service layer
5. **Retry with backoff + timeout** — Proxy retries 5 times, 30s timeout per attempt, skips non-retryable errors
6. **Idempotency** — Duplicate idempotencyKey returns existing transaction
7. **Template Method** — BaseTemplate defines validate → initiate → confirm flow
8. **VerifyPayment uses DB keys** — Signature verification fetches keySecret from ProviderKey, not process.env
9. **Status lowercase** — Transaction status enum uses lowercase ("paid", not "Paid")
10. **Promise.all** — `GetInstance` parallelizes two independent DB reads
11. **Promise.race** — Proxy wraps gateway call with 30s timeout
12. **Fire-and-forget Redis** — Second Redis write in webhook is non-blocking
