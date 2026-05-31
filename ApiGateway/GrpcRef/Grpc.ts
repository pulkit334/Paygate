import path from "path";
import { fileURLToPath } from "url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GrpcPath = path.resolve(__dirname, "../../backend/proto/merchant.proto");
const packageDefinition = protoLoader.loadSync(GrpcPath, {});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

const merchantClient = new protoDescriptor.authpackage.MerchantAuth(
  "localhost:50001",
  grpc.credentials.createInsecure(),
);

export { merchantClient };
