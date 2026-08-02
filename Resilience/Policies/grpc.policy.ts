import { wrap } from "cockatiel";
import { createBulkhead } from "../builders/bulkheads";
import { createTimeout } from "../builders/timeout";
import { grpcBulkheadConfig } from "../config/grpcBulkheadConfig";
import { grpcTimeoutConfig } from "../config/grpcTimeoutConfig";

const bulkheadPolicy = createBulkhead(grpcBulkheadConfig);
const timeoutPolicy = createTimeout(grpcTimeoutConfig);

export const grpcPolicy = wrap(bulkheadPolicy, timeoutPolicy);
