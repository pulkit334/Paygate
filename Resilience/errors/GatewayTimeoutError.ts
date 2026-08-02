import { ResilienceError } from "../errors/ResillienceError";

export class GatewayTimeoutError extends ResilienceError {
  constructor() {
    super("Gateway request time out ", "PAYMENT_GATEWAY_TIMEOUT");

    this.name = "GatewayTimeoutError";
  }
}
