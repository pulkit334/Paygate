// Original file: proto/payment.proto


export interface VerifyOrderRequest {
  'appId'?: (string);
  'razorpayOrderId'?: (string);
  'razorpayPaymentId'?: (string);
  'razorpaySignature'?: (string);
}

export interface VerifyOrderRequest__Output {
  'appId'?: (string);
  'razorpayOrderId'?: (string);
  'razorpayPaymentId'?: (string);
  'razorpaySignature'?: (string);
}
