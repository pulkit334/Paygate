import { wrap } from "cockatiel";
import { createCircuitBreaker } from "../builders/circuitbreaker";
import {createTimeout} from  "../builders/timeout"
import { razorpayTimeoutConfig } from "../config/razorpayTimeoutConfig";


import {
  razerpayBreakerConfig,
} from "../config/resilience.config";


const breaker = createCircuitBreaker(razerpayBreakerConfig);
const timeoutPolicy = createTimeout(razorpayTimeoutConfig);

export const razerpayPolicy = wrap(breaker,timeoutPolicy);