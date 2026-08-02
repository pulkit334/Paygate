import {retry,handleWhen,ExponentialBackoff,} from "cockatiel";
import { RetryConfig } from "../types/resilience.types";

export function createRetry(config : RetryConfig)  {
return retry(
    handleWhen(config.shouldRetry),{
        maxAttempts : config.maxAttempts,
        backoff: new ExponentialBackoff({
            initialDelay: config.initialDelay,
            maxDelay: config.maxDelay
        })
    }
)
}
