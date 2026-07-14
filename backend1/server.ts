import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import "./config/redis";
import { ConnectDb } from "./config/database";
import * as grpc from "@grpc/grpc-js";
import * as protLoader from "@grpc/proto-loader";
dotenv.config();
import { createOrder, GetTransaction, VerifyOrder } from "./controller/app.payment";
import { DashboardAnalytics, GetAnalyticsSummary } from "./controller/app.analytics";
import { UpdateProviderKey, GetProviderKeys, DeleteProviderKey } from "./controller/app.payment-setting";
import { GetLedger } from "./controller/app.ledger";

import { fileURLToPath } from "url";
import path from "path";

const PORT = process.env.GRPC_PORT || 50051;

//Load the Path First
const PROTO_PATH = path.resolve(__dirname, "./proto/payment.proto");
const packageDefinition = protLoader.loadSync(PROTO_PATH) as any;
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const authPackage = protoDescriptor.paymentpackage;

///server Intilize
const Server = new grpc.Server();
//add the server
Server.addService(authPackage.PaymentService.service, {
  CreateOrder: createOrder,
  VerifyOrder: VerifyOrder,
  GetTransctions: GetTransaction,
  GetDailyVolume: DashboardAnalytics,
  GetAnalyticsSummary: GetAnalyticsSummary,
  UpdateProviderKey: UpdateProviderKey,
  GetProviderKeys: GetProviderKeys,
  DeleteProviderKey: DeleteProviderKey,
  GetLedger: GetLedger,
});

// app.use(
//   "/api/v1/webhooks",
//   express.raw({ type: "application/json" }),
//   WebhookPath,
// );
// app.get("/", (req: Request, Response: Response) => {
//   console.log("hi ehllo ");
// });
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(morgan("dev"));

const startServer = async () => {
  await ConnectDb();

  Server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error(`Failed to bind: ${error.message}`);
        return;
      }
      console.log(`[Merchant Service] gRPC Server listening on port ${port}`);
    },
  );
};
startServer();
