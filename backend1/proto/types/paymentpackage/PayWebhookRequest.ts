// Original file: proto/payment.proto

import type { WebhookBody as _paymentpackage_WebhookBody, WebhookBody__Output as _paymentpackage_WebhookBody__Output } from '../paymentpackage/WebhookBody';

export interface PayWebhookRequest {
  'signature'?: (string);
  'body'?: (_paymentpackage_WebhookBody | null);
}

export interface PayWebhookRequest__Output {
  'signature'?: (string);
  'body'?: (_paymentpackage_WebhookBody__Output);
}
