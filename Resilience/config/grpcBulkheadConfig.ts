import { BulkHeadConif } from "../types/resilience.types";

export const grpcBulkheadConfig: BulkHeadConif = {
  maxConcurrency: 100,
  maxQueueSize: 50,
};