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
      type: mongoose.Schema.Types.ObjectId, //
      ref: "App",
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,        //
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
      required: false,     // 
    },
  },
  { timestamps: true }     // 
);

LedgerSchema.index({ appId: 1 });
LedgerSchema.index({ transactionId: 1 }, { unique: true });

const TransactionLedger: Model<ILedger> = mongoose.model<ILedger>(
  "Ledger",
  LedgerSchema,
);

export default TransactionLedger;