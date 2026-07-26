import ProviderKey from "../../models/providerKey";
import { decrypt } from "../../util/encryption";

class GatewayCredentialService {
  static async GetInstance(appId: string, providerName: string) {
    const keyRecord = await ProviderKey.findOne({
      appId,
      provider: { $regex: `^${providerName}$`, $options: "i" },
      isActive: true,
    }).lean();

    if (!keyRecord) {
      throw new Error(
        `${providerName} credentials not configured or inactive for appId: ${appId}`,
      );
    }
    const key_Id = keyRecord.keyId;
    const secret_Key = decrypt(keyRecord.keySecret);

    return { key_Id, secret_Key };
  }
}

export default GatewayCredentialService;
