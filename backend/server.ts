import dotenv from "dotenv";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import express from "express";
import { ConnectDb } from "./config/database";
import {
  RegisterAppController,
  LoginController,
  ValidateApiKey,
  MiddlewareAuth,
  ListApis,
  DeleteApi,
  updateCallbackUrl,
  GetSettings,
} from "./controller/app.controller";
import { CreateApiKey, ListApiKeys, DeleteApiKey } from "./controller/app.api-keys";
dotenv.config();
const PORT = process.env.GRPC_PORT || 50051;
const app = express();
app.use(express.json());
// 1. LOAD THE PROTO CONTRACT FILE
const PROTO_PATH = path.resolve(__dirname, "./proto/merchant.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  //leave for now 
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const authPackage = protoDescriptor.authpackage;

// 2. INITIALIZE gRPC SERVER
const server = new grpc.Server();

server.addService(authPackage.MerchantAuth.service, {
  Auth: RegisterAppController,
  Login: LoginController,
  ValidateApiKey: ValidateApiKey,
  MiddlewareAuth: MiddlewareAuth,
  ListApis: ListApis,
  DeleteApi: DeleteApi,
  UpdateCallbackUrl: updateCallbackUrl,
  GetSettings: GetSettings,
  CreateApiKey: CreateApiKey,
  ListApiKeys: ListApiKeys,
  DeleteApiKey: DeleteApiKey,
});

const startServer = async () => {
  await ConnectDb();

  server.bindAsync(
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
