import mongoose, { Mongoose } from "mongoose";
export const ConnectDb = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(process.env.Db!);
  console.log("DB connected");
};
