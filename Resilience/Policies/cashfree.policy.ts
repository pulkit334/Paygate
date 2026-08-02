import { wrap } from "cockatiel";
import { createCircuitBreaker } from "../builders/circuitbreaker";
import { createTimeout } from "../builders/timeout";
import { cashfreeTimeoutConfig } from "../config/cashfreeTimeoutConfig";
import { cashfreeBreakerConfig } from "../config/resilience.config";

export const cashfreeBreaker = createCircuitBreaker(cashfreeBreakerConfig);

const timeout = createTimeout(cashfreeTimeoutConfig);

export const cashfreepolicy = wrap(cashfreeBreaker,timeout);