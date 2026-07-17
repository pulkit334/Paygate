import ProviderKey from "../../models/providerKey";
import { decrypt } from "../../util/encryption";

class RazerPayService {

  static async getKeyId(appId: string): Promise<string> {
    const key = await ProviderKey.findOne({
      appId,
      provider: { $regex: "^razorpay$", $options: "i" },
      isActive: true,
    });
    if (!key) throw new Error("Razorpay Key ID not configured for appId: " + appId);
    return key.keyId;
  }
  static async GetKeySecret(appId: string): Promise<string> {
    const key = await ProviderKey.findOne({
      appId,
      provider: { $regex: "^razorpay$", $options: "i" },
      isActive: true,   
    })
      .select("keySecret")
      .lean();
    if (!key) throw new Error("Razorpay Secretkey not configured for appId: " + appId);
    return decrypt(key.keySecret);
  }


static async GetInstance(appId: string) {
  const [Key_id, secretKey] = await Promise.all([
    this.getKeyId(appId),
    this.GetKeySecret(appId),
  ]);
  return { Key_id, secretKey };
}
}

export default RazerPayService;