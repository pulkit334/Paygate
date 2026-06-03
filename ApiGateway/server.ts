import experes, { urlencoded } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
dotenv.config();
const app = experes();

//Local Imports
import MerchantRoutes from "./Routes/MerhcantRoutes";
import PaymentRoutes from "./Routes/PaymentRoutes";
import helmet from "helmet";
// import { METHODS } from "http";

app.use(experes.urlencoded({ extended: true }));
app.use(experes.json());
app.use(morgan("dev"));
app.use(helmet());
app.use("/webhook/razorpay", experes.raw({ type: "application/json" }));
// app.use(
//   cors({
//     origin: process.env.FrontendURL,
//     methods: ["POST", "GET", "PUT", "PATCH"],
//     credentials: true,
//   }),
// );
app.use("/api/v1", MerchantRoutes);
app.use("/api/v2", PaymentRoutes);
const PORT = process.env.PORT || 6283;
app.listen(PORT, () => [console.log(`Server is listening on port ${PORT}`)]);
