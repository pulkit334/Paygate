import { ResilienceError } from "../errors/ResillienceError";

export class RetryExhaustedError extends ResilienceError {
  constructor() {
    super(
      "Retry attempts exhausted",
      "WEBHOOK_RETRY_EXHAUSTED"
    );

    this.name = "RetryExhaustedError";
  }
}