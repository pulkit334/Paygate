import Razorpay from "razorpay";
import RazerPayService from "../Engine/key/provider";

const instance = async (appId: string) => {
  try {
    const keys = await RazerPayService.GetInstance(appId);
    if (!keys.Key_id || !keys.secretKey) {
      throw new Error("Key_id or secretKey is undefined from DB");
    }
    return new Razorpay({
      key_id: keys.Key_id,
      key_secret: keys.secretKey,
    });
  } catch (dbError: any) {
    console.error(`[Razorpay] DB key lookup failed: ${dbError.message}. Falling back to env vars.`);
    const envKeyId = process.env.RAZORPAY_KEY_ID;
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!envKeyId || !envKeySecret) {
      throw new Error("No Razorpay keys found in DB or env vars");
    }
    return new Razorpay({
      key_id: envKeyId,
      key_secret: envKeySecret,
    });
  }
};

export default instance;
