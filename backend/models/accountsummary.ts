import mongoose, { Schema, Model } from "mongoose";

export interface IAccountSummary {
  appId: mongoose.Types.ObjectId;
  totalReceived: number;
  totalTransactions: number;
  totalDeduction: number;
  successCount: number;
  failureCount: number;
  lastPaymentAt?: Date;
}

const AccountSummarySchema = new Schema<IAccountSummary>(
  {
    appId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "App",
      required: true                    
    },
    totalReceived: {
      type: Number,
      required: true,
      default: 0,
    },
    totalTransactions: {
      type: Number,
      required: true,
      default: 0,
    },
    totalDeduction: {
      type: Number,
      required: true,
      default: 0,
    },
    successCount: {
      type: Number,
      required: true,
      default: 0,
    },
    failureCount: {
      type: Number,
      required: true,
      default: 0,
    },
    lastPaymentAt: {               
      type: Date,
    },
  },
  { timestamps: true }                   
);

AccountSummarySchema.index({ appId: 1 });

const AC: Model<IAccountSummary> = mongoose.model<IAccountSummary>(
  "AccountSummary",
  AccountSummarySchema,
);

export default AC;