import Razorpay from "razorpay";
import RazerPayService from "../Engine/key/provider";

const instance = async (appId: string) => {
  const keys = await RazerPayService.GetInstance(appId);
  return new Razorpay({
    key_id: keys.Key_id,
    key_secret: keys.secretKey,
  });
};

export default instance;
