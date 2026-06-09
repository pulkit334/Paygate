import path from "path";
import { fileURLToPath } from "url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../../");

console.log("projectRoot:", projectRoot);

const GrpcPath = path.join(projectRoot, "backend/proto/merchant.proto");
const GRPCPaymentServicePath = path.join(projectRoot, "backend1/proto/payment.proto");

console.log("GrpcPath:", GrpcPath);
console.log("GRPCPaymentServicePath:", GRPCPaymentServicePath);

const packageDefinition = protoLoader.loadSync(GrpcPath, {});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

const packageDefinitionPaymentService = protoLoader.loadSync(GRPCPaymentServicePath, {});
const protoDescriptorPaymentone = grpc.loadPackageDefinition(packageDefinitionPaymentService) as any;

const merchantClient = new protoDescriptor.authpackage.MerchantAuth(
  "localhost:50001",
  grpc.credentials.createInsecure(),
);

const PaymentClient = new protoDescriptorPaymentone.paymentpackage.PaymentService(
  "localhost:50051",
  grpc.credentials.createInsecure(),
);

export { merchantClient, PaymentClient };