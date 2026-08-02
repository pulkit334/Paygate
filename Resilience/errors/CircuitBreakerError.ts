import { ResilienceError } from "../errors/ResillienceError";

export class CircuitBreakerError extends ResilienceError {
  constructor() {
    super("Gateway temporarily unavailable", "PAYMENT_GATEWAY_UNAVAILABLE");

    this.name = "CircuitBreakerOpenError";
  }
}
