# Payment System - Complete Source Code

## Architecture Overview

```
Controller (gRPC)
    ↓
PaymentService
    ↓
GatewayFactory (Singleton)
    ↓
PaymentGatewayProxy (Retry + Backoff + Error Logging)
    ↓
BaseTemplate (Template Method)
    ↓
RazerPayProvider (Razorpay SDK, appId-scoped)
    ↓
config/razerpay.ts (Async Key Fetch)
    ↓
Engine/key/provider.ts (DB Key Lookup)
    ↓
ProviderKey Model (MongoDB)
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
└── controller/
    ├── app.payment.ts
    └── app.webhook.ts
```

---

## 1. Interfaces

### Interfaces/paymentgateway.ts
```typescript
export interface IPaymentGateway {
  processPayment(data: any, appId: string): Promise<any>;
}
```

---

## 2. Types

### types/GatewayTypes.ts
```typescript
export enum GatewayType {
    PAYTM = "PAYTM",
    RAZORPAY = "RAZORPAY",
    STRIPE = "STRIPE",
    MOCK = "MOCK"
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

---

## 3. Models

### models/transction.ts
```typescript
import mongoose, { Schema, Model, mongo } from "mongoose";
import { string } from "zod";

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
      type: string,
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
  { timestamps: true }
);

providerKeySchema.index({ appId: 1, provider: 1 }, { unique: true });

const ProviderKey: Model<IProviderKey> = mongoose.model<IProviderKey>(
  "ProviderKey",
  providerKeySchema
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
  { timestamps: true }
);

LedgerSchema.index({ appId: 1 });
LedgerSchema.index({ transactionId: 1 }, { unique: true });

const TransactionLedger: Model<ILedger> = mongoose.model<ILedger>(
  "Ledger",
  LedgerSchema,
);

export default TransactionLedger;
```

---

## 4. Config

### config/razerpay.ts
```typescript
import Razorpay from "razorpay";
import RazerPayService from "../Engine/key/provider";

const instance = async (appId: string) => {
  const keys = await RazerPayService.Getnstance(appId);
  return new Razorpay({
    key_id: keys.Key_id,
    key_secret: keys.secretKey,
  });
};

export default instance;
```

---

## 5. Engine (Core Payment Logic)

### Engine/PaymentEngine.ts
```typescript
import Razorpay from "razorpay";
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
import { BaseTemplate } from "../BaseTemplate";

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
        return await this.RealGateway.processPayment(data, appId);
      } catch (error: any) {
        console.error(`[Proxy Shield] Attempt ${attempt} error:`, error.message || error);
        if (attempt >= this.maxRetries) {
          throw new Error(
            `[Proxy Shield] Bank completely dead after ${this.maxRetries} attempts. Last error: ${error.message}`,
          );
        }

        const baseDelay = 1000;
        const exponentialvalue = baseDelay * Math.pow(2, attempt);
        const currentCeiling = Math.min(cap, exponentialvalue);
        const totalWaitTime = Math.floor(Math.random() * currentCeiling);

        console.log(
          `[Proxy Shield] Attempt ${attempt} failed. Resting for ${totalWaitTime}ms...`,
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

  static async Getnstance(appId: string) {
    const Key_id = await this.getKeyId(appId);
    const secretKey = await this.GetKeySecret(appId);
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
      throw new Error(`[Razorpay] Failed to initiate order: ${JSON.stringify(error)}`);
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

---

## 6. Service

### services/app.PaymentService.ts
```typescript
import { Request, Response } from "express";
import { GatewayType } from "../types/GatewayTypes";
import Transaction from "../models/transction";
import { PaymentData } from "../types/PaymentTypes";
import { GatewayFactory } from "../Engine/PaymentEngine";
import crypto from "crypto";
import RazerPayService from "../Engine/key/provider";

export class PaymentService {
  static async initiatePayment(PaymentData: any, appId: string) {
    console.log("the data for the class would be ", PaymentData);
    const {
      amount,
      currency,
      metadata,
      idempotencyKey,
      customerName,
      customoreEmail,
      Provider,
    } = PaymentData;

    try {
      let newTransaction;
      try {
        newTransaction = await Transaction.create({
          appId,
          amount,
          currency: currency || "INR",
          customerEmail: customoreEmail,
          customerName,
          metadata,
          idempotencyKey,
          Provider,
          status: "created",
        });
      } catch (err: any) {
        if (err.code === 11000) {
          console.log("DUPLICATE KEY  ERROR:", err.message);
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
      console.log("the gatway Response would be ", paymentPayload);
      const gatewayResponse =
        await paymentEngine.processPayment(paymentPayload, appId);

      newTransaction.razorpayOrderId = gatewayResponse.orderId;
      await newTransaction.save();
      console.log("the order id strureo would be ", gatewayResponse);
      return {
        transactionId: newTransaction._id,
        providerOrderId: gatewayResponse.orderId,
        amount: newTransaction.amount,
        currency: newTransaction.currency,
        providerUsed: targetGateway,
      };
    } catch (error: any) {
      console.error("==== RAZORPAY CRASH ====");
      console.error(error);
      throw new Error(`Service Failure: ${error.message}`);
    }
  }

  static async VerifyPayment(VerficationData: any, appId: string) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      VerficationData;

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

---

## 7. Controllers

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
  console.log("the data inside the createOrder will be ", call.request);
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

    console.log(PaymentResponse);

    if (!PaymentResponse) {
      return callback({
        code: status.NOT_FOUND,
        message: "Payment could not be initiated",
      });
    }
    const response = PaymentResponse as any;
    console.log("Sending response:", {
      success: true,
      orderId: response.providerOrderId,
      amount: response.amount,
      currency: response.currency,
      status: "created",
      createdAt: new Date().toISOString(),
      error: "",
    });

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

export const GetTransction = async (call: ServerUnaryCall<any, any>, callback: sendUnaryData<any>) => {
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
import { Request, Response } from "express";
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
      console.warn("Razorpay webhook: invalid signature");
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
        }).session(session);
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

    // 5. Push to payment stream
    await redisClient.xadd(
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
    );

    // gRPC success response
    return callback(null, {
      success: true,
      message: "Webhook received and processed",
      error: "",
    });
  } catch (error: any) {
    console.error(
      "Razorpay webhook processing error:",
      error?.message ?? error,
    );

    // gRPC error response
    return callback({
      code: status.INTERNAL,
      message: error.message || "Internal server error",
    });
  }
};

export default payWebhook;
```

---

## appId Flow Diagram

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
GatewayFactory
  └→ new RazerPayProvider(appId)
  └→ new PaymentGatewayProxy(provider, 5)
       ↓
PaymentGatewayProxy.processPayment(data, appId)
  └→ retry loop with exponential backoff
  └→ logs actual error on each failure
       ↓
BaseTemplate.processPayment(data, appId)
  └→ validate(data)
  └→ initiate(data)
       ↓
RazerPayProvider.initiate(data)
  └→ await instance(this.appId)
       ↓
config/razerpay.ts
  └→ RazerPayService.Getnstance(appId)
       ↓
Engine/key/provider.ts
  └→ ProviderKey.findOne({ appId, provider: "razorpay" })
  └→ returns { keyId, keySecret }
       ↓
new Razorpay({ key_id, key_secret })
  └→ razorpay.orders.create({ amount * 100, currency, receipt })
       ↓
RazerPayProvider.confirm(order)
  └→ { orderId, amount/100, currency, status }
       ↓
PaymentService returns { transactionId, providerOrderId, amount, currency }
       ↓
Controller returns to ApiGateway → Frontend
  └→ Frontend opens Razorpay checkout modal with orderId
```

---

## Key Design Decisions

1. **BYOK (Bring Your Own Key)** — Users store their own Razorpay/Stripe keys in ProviderKey collection
2. **Async Key Fetch** — `config/razerpay.ts` is async because keys come from DB
3. **appId everywhere** — Each provider instance is scoped to one merchant's keys
4. **Single amount conversion** — Amount converted to paise only in `RazerPayProvider.initiate()` (`data.amount * 100`), raw rupees passed through service layer
5. **Retry with backoff + error logging** — Proxy retries 5 times, logs actual error on each failure
6. **Idempotency** — Duplicate idempotencyKey returns existing transaction
7. **Template Method** — BaseTemplate defines validate → initiate → confirm flow
8. **VerifyPayment uses DB keys** — Signature verification fetches keySecret from ProviderKey, not process.env
9. **Status lowercase** — Transaction status enum uses lowercase ("paid", not "Paid")
