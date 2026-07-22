import mongoose, { Schema, Model } from "mongoose";

export interface IApiKey {
  _id?: mongoose.Types.ObjectId;
  name: string;
  publicKey: string;
  hashedSecret: string;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface IApp {
  name: string;
  publicKey?: string;
  hashedSecret?: string;
  isActive: boolean;
  callbackUrl?: string;
  ownerEmail: string;
  passwordHash: string;
  apiKeys: IApiKey[];
}

const appSchema = new Schema<IApp>(
  {
    name: {
      type: String,
      required: true,
    },

    publicKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    ownerEmail: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    hashedSecret: {
      type: String,
    },

    callbackUrl: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    apiKeys: {
      type: [{
        name: { type: String, required: true },
        publicKey: { type: String, required: true },
        hashedSecret: { type: String, required: true },
        expiresAt: { type: Date, default: null },
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const App: Model<IApp> = mongoose.model<IApp>("App", appSchema);

export default App;
