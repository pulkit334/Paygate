import crypto from "crypto";

export const generateApikeys = () => {
  const publicKey = `Pk_Live_${crypto.randomBytes(16).toString("hex")}`;
  const Secretkey = `SK_live_${crypto.randomBytes(32).toString("hex")}`;
  const hashedSecret = crypto.createHash("sha256").update(Secretkey).digest("hex");
  return { publicKey, Secretkey, hashedSecret };
};
