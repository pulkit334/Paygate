import { CircuitBreakerConfig, RetryConfig } from "../types/resilience.types";
import { TimeoutConfig } from "../types/resilience.types";
export const razerpayBreakerConfig: CircuitBreakerConfig = {
  threshold: 0.5,
  duration: 10_000,
  minimumRps: 5,
  halfOpenAfter: 50_000,
  halfOpenSampling: {
    calls: 5,
    threshold: 0.5,
  },
};

export const cashfreeBreakerConfig: CircuitBreakerConfig = {
  threshold: 0.7,
  duration: 10_000,
  minimumRps: 5,
  halfOpenAfter: 30_000,
  halfOpenSampling: {
    calls: 5,
    threshold: 0.5,
  },
};



