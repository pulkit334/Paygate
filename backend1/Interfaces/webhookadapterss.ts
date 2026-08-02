export interface INormalizedWebhookEvent {
  provider: string;
  captured: boolean;
  gatewayOrderId: string;
  gatewayPayId: string;
  amountPaise: number;
  currency: string;
}

export interface IWebhookAdapter {
  verifySignature(rawBody: string, signature: string, timestamp?: string): boolean;
  normalize(rawBody: string): INormalizedWebhookEvent;
}