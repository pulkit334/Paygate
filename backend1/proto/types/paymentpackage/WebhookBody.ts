// Original file: proto/payment.proto

import type { WebhookPayload as _paymentpackage_WebhookPayload, WebhookPayload__Output as _paymentpackage_WebhookPayload__Output } from '../paymentpackage/WebhookPayload';

export interface WebhookBody {
  'event'?: (string);
  'payload'?: (_paymentpackage_WebhookPayload | null);
}

export interface WebhookBody__Output {
  'event'?: (string);
  'payload'?: (_paymentpackage_WebhookPayload__Output);
}
