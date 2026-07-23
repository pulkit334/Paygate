import path from "path";
import { fileURLToPath } from "url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../../");

const GrpcPath = path.join(projectRoot, "backend/proto/merchant.proto");
const GRPCPaymentServicePath = path.join(projectRoot, "backend1/proto/payment.proto");

const packageDefinition = protoLoader.loadSync(GrpcPath, { keepCase: true });
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

const packageDefinitionPaymentService = protoLoader.loadSync(GRPCPaymentServicePath, { keepCase: true });
const protoDescriptorPaymentone = grpc.loadPackageDefinition(packageDefinitionPaymentService) as any;


const GRPC_DEADLINE_MS = 10_000;

const MERCHANT_GRPC_URL = process.env.MERCHANT_GRPC_URL || "localho st:50002";
const PAYMENT_GRPC_URL = process.env.PAYMENT_GRPC_URL || "localhost:50051";

const merchantClient = new protoDescriptor.authpackage.MerchantAuth(
  MERCHANT_GRPC_URL,
  grpc.credentials.createInsecure(),
  {
    "grpc.keepalive_time_ms": 30_000,
    "grpc.keepalive_timeout_ms": 10_000,
  },
);

const PaymentClient = new protoDescriptorPaymentone.paymentpackage.PaymentService(
  PAYMENT_GRPC_URL,
  grpc.credentials.createInsecure(),
  {
    "grpc.keepalive_time_ms": 30_000,
    "grpc.keepalive_timeout_ms": 10_000,
  },
);

export { merchantClient, PaymentClient, GRPC_DEADLINE_MS };
