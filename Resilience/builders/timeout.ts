import { timeout, TimeoutStrategy } from "cockatiel";
import { TimeoutConfig } from "../types/resilience.types";

export function createTimeout(config: TimeoutConfig) {
  return timeout(config.duration, TimeoutStrategy.Aggressive);
}
