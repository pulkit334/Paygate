import mongoose, { Schema, Model } from "mongoose";
export interface IApp {
  name: string;
  publicKey?: string; 
  hashedSecret?: string; 
  isActive: boolean;
  callbackUrl?: string;
  ownerEmail: string;
  passwordHash: string;
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
      sparse: true, // allows multiple docs without publicKey!
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
  },
  {
    timestamps: true,
  },
);

const App: Model<IApp> = mongoose.model<IApp>("App", appSchema);

export default App;
