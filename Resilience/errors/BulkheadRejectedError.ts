import { ResilienceError } from "../errors/ResillienceError";

export class BulkheadRejectedError extends ResilienceError {
  constructor() {
    super(
      "Gateway is busy",
      "PAYMENT_GATEWAY_BUSY"
    );

    this.name = "BulkheadRejectedError";
  }
}