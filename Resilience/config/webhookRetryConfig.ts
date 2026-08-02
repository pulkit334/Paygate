import { RetryConfig } from "../types/resilience.types";

export const webhookRetryConfig: RetryConfig = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 4000,
  shouldRetry: (error) => {
    return true// replce it with proper retry logic 
  },
};
