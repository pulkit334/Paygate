// Original file: proto/payment.proto


export interface WebhookPaymentEntity {
  'orderId'?: (string);
  'id'?: (string);
  'amount'?: (number | string);
  'currency'?: (string);
}

export interface WebhookPaymentEntity__Output {
  'orderId'?: (string);
  'id'?: (string);
  'amount'?: (number);
  'currency'?: (string);
}
