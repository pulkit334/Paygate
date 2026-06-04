// Original file: proto/payment.proto


export interface CreateOrderRequest {
  'appId'?: (string);
  'amount'?: (number | string);
  'currency'?: (string);
  'receipt'?: (string);
  'notes'?: (string);
  'customerName'?: (string);
  'idempotencyKey'?: (string);
  'Provider'?: (string);
  'customoreEmail'?: (string);
  'metadata'?: (string);
}

export interface CreateOrderRequest__Output {
  'appId'?: (string);
  'amount'?: (number);
  'currency'?: (string);
  'receipt'?: (string);
  'notes'?: (string);
  'customerName'?: (string);
  'idempotencyKey'?: (string);
  'Provider'?: (string);
  'customoreEmail'?: (string);
  'metadata'?: (string);
}
