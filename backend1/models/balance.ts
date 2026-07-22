import mongoose, { Schema, Model } from "mongoose";

export interface IBalance {
  appId: mongoose.Types.ObjectId;
  amount: number;
}

const balanceSchema = new Schema<IBalance>(
  {
    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "App",
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

const Balance: Model<IBalance> = mongoose.model<IBalance>("Balance", balanceSchema);

export default Balance;
