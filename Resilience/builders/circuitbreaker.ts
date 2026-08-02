import { circuitBreaker, handleAll, SamplingBreaker } from "cockatiel";
import { CircuitBreakerConfig } from "../types/resilience.types";

export function createCircuitBreaker(
  config: CircuitBreakerConfig,
): ReturnType<typeof circuitBreaker> {
  const samplingBreaker = new SamplingBreaker({
    threshold: config.threshold,
    duration: config.duration,
    minimumRps: config.minimumRps,
  });

  const breaker = circuitBreaker(handleAll, {
    breaker: samplingBreaker,
    halfOpenAfter: config.halfOpenAfter,
    halfOpenSampling: config.halfOpenSampling,
  });
  return breaker;
}
