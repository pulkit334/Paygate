// Original file: proto/payment.proto


export interface CreateOrderResponse {
  'success'?: (boolean);
  'orderId'?: (string);
  'amount'?: (number | string);
  'currency'?: (string);
  'receipt'?: (string);
  'status'?: (string);
  'createdAt'?: (string);
  'error'?: (string);
}

export interface CreateOrderResponse__Output {
  'success'?: (boolean);
  'orderId'?: (string);
  'amount'?: (number);
  'currency'?: (string);
  'receipt'?: (string);
  'status'?: (string);
  'createdAt'?: (string);
  'error'?: (string);
}
