import ProviderKey from "../../models/providerKey";
import { decrypt } from "../../util/encryption";

class RazerPayService {

  static async getKeyId(appId: string): Promise<string> {
    const key = await ProviderKey.findOne({
      appId,
      provider: "razorpay",
      isActive: true,
    });
    if (!key) throw new Error("Razorpay Key ID not configured");
    return key.keyId;
  }
  static async GetKeySecret(appId: string): Promise<string> {
    const key = await ProviderKey.findOne({
      appId,
      provider: "razorpay",
      isActive: true,   
    })
      .select("keySecret")
      .lean();
    if (!key) throw new Error("Razorpay Secretkey ID not configured");
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