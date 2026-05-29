import App from "../models/app";
import { generateApikeys } from "../util/keygen";
import bcrypt from "bcrypt";

const appservice = async (name: string, ownerEmail: string, password: string, callbackUrl?: string) => {
  try {
    const existingApp = await App.findOne({ ownerEmail });
    if (existingApp) {
      throw new Error("Email is already registered to an application");
    }

    const keys = generateApikeys();
    if (!keys) {
      throw new Error("Failed to generate API keys");
    }
    const { publicKey, hashedSecret, Secretkey } = keys;
    

    const hashedSecretStr =
      typeof hashedSecret === "string"
        ? hashedSecret
        : hashedSecret?.toString("hex");

    const passwordHash = await bcrypt.hash(password, 10);

    const newApp = await App.create({
      name,
      ownerEmail,
      passwordHash,
      callbackUrl,
      publicKey,
      hashedSecret: hashedSecretStr,
      isActive: true,
    });

    return {
      message:
        "WARNING: Store this secretKey immediately. It will never be shown again.",
      appid: newApp._id,
      name: newApp.name,
      publicKey,
      Secretkey, // Plaintext returned exactly once here
    };
  } catch (error: any) {
    // Log the structural error for infrastructure debugging
    console.error(`[AppService Error Operations]: ${error.message}`);

    throw error;
  }
};

export default appservice;