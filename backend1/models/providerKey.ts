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
