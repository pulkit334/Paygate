import Razorpay from "razorpay";
import GatewayCredentialService from "../Engine/key/provider";
import { Cashfree,CFEnvironment } from "cashfree-pg";

export interface RazorpayCredentials {
  key_id: string;
  key_secret: string;
}

export const getRazorpayCredentials = async (appId: string): Promise<RazorpayCredentials> => {
  try {
    const keys = await GatewayCredentialService.GetInstance(appId, "razorpay");
    if (!keys.key_Id || !keys.secret_Key) {
      throw new Error("Key_id or secretKey is undefined from DB");
    }

    return {
      key_id: keys.key_Id,
      key_secret: keys.secret_Key,
    };
  } catch (dbError: any) {
    console.error(`[Razorpay] DB key lookup failed: ${dbError.message}. Falling back to env vars.`);
    const envKeyId = process.env.RAZORPAY_KEY_ID;
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!envKeyId || !envKeySecret) {
      throw new Error("No Razorpay keys found in DB or env vars");
    }

    return {
      key_id: envKeyId,
      key_secret: envKeySecret,
    };
  }
};

const instance = async (appId: string) => {
  const credentials = await getRazorpayCredentials(appId);
  return new Razorpay(credentials);
};

export default instance;
interface GatewayCredentials {
  key_Id: string;
  secret_Key: string;
  mode?: "TEST" | "PRODUCTION";
}

function resolveEnv(keyId: string, mode?: "TEST" | "PRODUCTION"): CFEnvironment {

  if (mode) {
    return mode === "TEST" ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION;
  }
  return keyId.startsWith("TEST") ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION;
}

export const cashfreeinstance = async (appId: string): Promise<Cashfree> => {
  let keys: GatewayCredentials | null = null;

  try {
    keys = await GatewayCredentialService.GetInstance(appId, "cashfree");
  } catch (dbError: any) {
    console.error(`[Cashfree] DB lookup failed for appId=${appId}: ${dbError.message}`);
  }

  if (!keys?.key_Id || !keys?.secret_Key) {
    throw new Error(`No Cashfree credentials found in DB for appId=${appId}`);
  }

  const env = resolveEnv(keys.key_Id, keys.mode);

  console.log(`[Cashfree] Initialized for appId=${appId} in ${CFEnvironment[env]} mode`);

  return new Cashfree(env, keys.key_Id, keys.secret_Key);
};