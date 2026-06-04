import mongoose, { Mongoose } from "mongoose";
let cachedConnection: typeof mongoose | null = null;
export const ConnectDb = async () => {
  try {
    if (cachedConnection) return cachedConnection;

    const dbUrl = process.env.Db;
    if (!dbUrl) throw new Error("Db environment variable is not set");

    cachedConnection = await mongoose.connect(dbUrl);
    console.log("the db successfully connected")
    return cachedConnection;
  } catch (error: any) {
    console.log("the Error Would be", error);
  }
};
