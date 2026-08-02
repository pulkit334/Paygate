import { bulkhead } from "cockatiel";
import { BulkHeadConif } from "../types/resilience.types";

export function createBulkhead(config: BulkHeadConif) {
  return bulkhead(config.maxConcurrency, config.maxQueueSize);
}
