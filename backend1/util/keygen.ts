import crypto from "crypto";

export const generateApikeys  = ()  => {
  try {
    //create key  for public one
    const  publicKey = `Pk_Live_${crypto.randomBytes(16).toString("hex")}`;
    //create key for secret One
    const Secretkey = `SK_live_${crypto.randomBytes(32).toString("hex")}`;
    // Hmac The Screte Key
    const hashedSecret = crypto.createHash("sha256").update(Secretkey).digest();
    //then return it to the user
    return {  publicKey, Secretkey, hashedSecret };
  } catch (error: any) {
    console.log("The Error Generatiing The Key's", error.message);
  }
};
