// Original file: proto/payment.proto

import type { WebhookPaymentEntity as _paymentpackage_WebhookPaymentEntity, WebhookPaymentEntity__Output as _paymentpackage_WebhookPaymentEntity__Output } from '../paymentpackage/WebhookPaymentEntity';

export interface WebhookPayload {
  'payment'?: (_paymentpackage_WebhookPaymentEntity | null);
}

export interface WebhookPayload__Output {
  'payment'?: (_paymentpackage_WebhookPaymentEntity__Output);
}
