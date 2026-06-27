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
