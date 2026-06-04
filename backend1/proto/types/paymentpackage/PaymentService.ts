// Original file: proto/payment.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { CreateOrderRequest as _paymentpackage_CreateOrderRequest, CreateOrderRequest__Output as _paymentpackage_CreateOrderRequest__Output } from '../paymentpackage/CreateOrderRequest';
import type { CreateOrderResponse as _paymentpackage_CreateOrderResponse, CreateOrderResponse__Output as _paymentpackage_CreateOrderResponse__Output } from '../paymentpackage/CreateOrderResponse';
import type { PayWebhookRequest as _paymentpackage_PayWebhookRequest, PayWebhookRequest__Output as _paymentpackage_PayWebhookRequest__Output } from '../paymentpackage/PayWebhookRequest';
import type { PayWebhookResponse as _paymentpackage_PayWebhookResponse, PayWebhookResponse__Output as _paymentpackage_PayWebhookResponse__Output } from '../paymentpackage/PayWebhookResponse';
import type { VerifyOrderRequest as _paymentpackage_VerifyOrderRequest, VerifyOrderRequest__Output as _paymentpackage_VerifyOrderRequest__Output } from '../paymentpackage/VerifyOrderRequest';
import type { VerifyOrderResponse as _paymentpackage_VerifyOrderResponse, VerifyOrderResponse__Output as _paymentpackage_VerifyOrderResponse__Output } from '../paymentpackage/VerifyOrderResponse';

export interface PaymentServiceClient extends grpc.Client {
  CreateOrder(argument: _paymentpackage_CreateOrderRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_CreateOrderResponse__Output>): grpc.ClientUnaryCall;
  CreateOrder(argument: _paymentpackage_CreateOrderRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_paymentpackage_CreateOrderResponse__Output>): grpc.ClientUnaryCall;
  CreateOrder(argument: _paymentpackage_CreateOrderRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_CreateOrderResponse__Output>): grpc.ClientUnaryCall;
  CreateOrder(argument: _paymentpackage_CreateOrderRequest, callback: grpc.requestCallback<_paymentpackage_CreateOrderResponse__Output>): grpc.ClientUnaryCall;
  createOrder(argument: _paymentpackage_CreateOrderRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_CreateOrderResponse__Output>): grpc.ClientUnaryCall;
  createOrder(argument: _paymentpackage_CreateOrderRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_paymentpackage_CreateOrderResponse__Output>): grpc.ClientUnaryCall;
  createOrder(argument: _paymentpackage_CreateOrderRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_CreateOrderResponse__Output>): grpc.ClientUnaryCall;
  createOrder(argument: _paymentpackage_CreateOrderRequest, callback: grpc.requestCallback<_paymentpackage_CreateOrderResponse__Output>): grpc.ClientUnaryCall;
  
  VerifyOrder(argument: _paymentpackage_VerifyOrderRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_VerifyOrderResponse__Output>): grpc.ClientUnaryCall;
  VerifyOrder(argument: _paymentpackage_VerifyOrderRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_paymentpackage_VerifyOrderResponse__Output>): grpc.ClientUnaryCall;
  VerifyOrder(argument: _paymentpackage_VerifyOrderRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_VerifyOrderResponse__Output>): grpc.ClientUnaryCall;
  VerifyOrder(argument: _paymentpackage_VerifyOrderRequest, callback: grpc.requestCallback<_paymentpackage_VerifyOrderResponse__Output>): grpc.ClientUnaryCall;
  verifyOrder(argument: _paymentpackage_VerifyOrderRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_VerifyOrderResponse__Output>): grpc.ClientUnaryCall;
  verifyOrder(argument: _paymentpackage_VerifyOrderRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_paymentpackage_VerifyOrderResponse__Output>): grpc.ClientUnaryCall;
  verifyOrder(argument: _paymentpackage_VerifyOrderRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_VerifyOrderResponse__Output>): grpc.ClientUnaryCall;
  verifyOrder(argument: _paymentpackage_VerifyOrderRequest, callback: grpc.requestCallback<_paymentpackage_VerifyOrderResponse__Output>): grpc.ClientUnaryCall;
  
  WebhookBody(argument: _paymentpackage_PayWebhookRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_PayWebhookResponse__Output>): grpc.ClientUnaryCall;
  WebhookBody(argument: _paymentpackage_PayWebhookRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_paymentpackage_PayWebhookResponse__Output>): grpc.ClientUnaryCall;
  WebhookBody(argument: _paymentpackage_PayWebhookRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_PayWebhookResponse__Output>): grpc.ClientUnaryCall;
  WebhookBody(argument: _paymentpackage_PayWebhookRequest, callback: grpc.requestCallback<_paymentpackage_PayWebhookResponse__Output>): grpc.ClientUnaryCall;
  webhookBody(argument: _paymentpackage_PayWebhookRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_PayWebhookResponse__Output>): grpc.ClientUnaryCall;
  webhookBody(argument: _paymentpackage_PayWebhookRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_paymentpackage_PayWebhookResponse__Output>): grpc.ClientUnaryCall;
  webhookBody(argument: _paymentpackage_PayWebhookRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_paymentpackage_PayWebhookResponse__Output>): grpc.ClientUnaryCall;
  webhookBody(argument: _paymentpackage_PayWebhookRequest, callback: grpc.requestCallback<_paymentpackage_PayWebhookResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface PaymentServiceHandlers extends grpc.UntypedServiceImplementation {
  CreateOrder: grpc.handleUnaryCall<_paymentpackage_CreateOrderRequest__Output, _paymentpackage_CreateOrderResponse>;
  
  VerifyOrder: grpc.handleUnaryCall<_paymentpackage_VerifyOrderRequest__Output, _paymentpackage_VerifyOrderResponse>;
  
  WebhookBody: grpc.handleUnaryCall<_paymentpackage_PayWebhookRequest__Output, _paymentpackage_PayWebhookResponse>;
  
}

export interface PaymentServiceDefinition extends grpc.ServiceDefinition {
  CreateOrder: MethodDefinition<_paymentpackage_CreateOrderRequest, _paymentpackage_CreateOrderResponse, _paymentpackage_CreateOrderRequest__Output, _paymentpackage_CreateOrderResponse__Output>
  VerifyOrder: MethodDefinition<_paymentpackage_VerifyOrderRequest, _paymentpackage_VerifyOrderResponse, _paymentpackage_VerifyOrderRequest__Output, _paymentpackage_VerifyOrderResponse__Output>
  WebhookBody: MethodDefinition<_paymentpackage_PayWebhookRequest, _paymentpackage_PayWebhookResponse, _paymentpackage_PayWebhookRequest__Output, _paymentpackage_PayWebhookResponse__Output>
}
