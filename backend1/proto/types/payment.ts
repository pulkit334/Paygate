import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { CreateOrderRequest as _paymentpackage_CreateOrderRequest, CreateOrderRequest__Output as _paymentpackage_CreateOrderRequest__Output } from './paymentpackage/CreateOrderRequest';
import type { CreateOrderResponse as _paymentpackage_CreateOrderResponse, CreateOrderResponse__Output as _paymentpackage_CreateOrderResponse__Output } from './paymentpackage/CreateOrderResponse';
import type { PayWebhookRequest as _paymentpackage_PayWebhookRequest, PayWebhookRequest__Output as _paymentpackage_PayWebhookRequest__Output } from './paymentpackage/PayWebhookRequest';
import type { PayWebhookResponse as _paymentpackage_PayWebhookResponse, PayWebhookResponse__Output as _paymentpackage_PayWebhookResponse__Output } from './paymentpackage/PayWebhookResponse';
import type { PaymentServiceClient as _paymentpackage_PaymentServiceClient, PaymentServiceDefinition as _paymentpackage_PaymentServiceDefinition } from './paymentpackage/PaymentService';
import type { VerifyOrderRequest as _paymentpackage_VerifyOrderRequest, VerifyOrderRequest__Output as _paymentpackage_VerifyOrderRequest__Output } from './paymentpackage/VerifyOrderRequest';
import type { VerifyOrderResponse as _paymentpackage_VerifyOrderResponse, VerifyOrderResponse__Output as _paymentpackage_VerifyOrderResponse__Output } from './paymentpackage/VerifyOrderResponse';
import type { WebhookBody as _paymentpackage_WebhookBody, WebhookBody__Output as _paymentpackage_WebhookBody__Output } from './paymentpackage/WebhookBody';
import type { WebhookPayload as _paymentpackage_WebhookPayload, WebhookPayload__Output as _paymentpackage_WebhookPayload__Output } from './paymentpackage/WebhookPayload';
import type { WebhookPaymentEntity as _paymentpackage_WebhookPaymentEntity, WebhookPaymentEntity__Output as _paymentpackage_WebhookPaymentEntity__Output } from './paymentpackage/WebhookPaymentEntity';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  paymentpackage: {
    CreateOrderRequest: MessageTypeDefinition<_paymentpackage_CreateOrderRequest, _paymentpackage_CreateOrderRequest__Output>
    CreateOrderResponse: MessageTypeDefinition<_paymentpackage_CreateOrderResponse, _paymentpackage_CreateOrderResponse__Output>
    PayWebhookRequest: MessageTypeDefinition<_paymentpackage_PayWebhookRequest, _paymentpackage_PayWebhookRequest__Output>
    PayWebhookResponse: MessageTypeDefinition<_paymentpackage_PayWebhookResponse, _paymentpackage_PayWebhookResponse__Output>
    PaymentService: SubtypeConstructor<typeof grpc.Client, _paymentpackage_PaymentServiceClient> & { service: _paymentpackage_PaymentServiceDefinition }
    VerifyOrderRequest: MessageTypeDefinition<_paymentpackage_VerifyOrderRequest, _paymentpackage_VerifyOrderRequest__Output>
    VerifyOrderResponse: MessageTypeDefinition<_paymentpackage_VerifyOrderResponse, _paymentpackage_VerifyOrderResponse__Output>
    WebhookBody: MessageTypeDefinition<_paymentpackage_WebhookBody, _paymentpackage_WebhookBody__Output>
    WebhookPayload: MessageTypeDefinition<_paymentpackage_WebhookPayload, _paymentpackage_WebhookPayload__Output>
    WebhookPaymentEntity: MessageTypeDefinition<_paymentpackage_WebhookPaymentEntity, _paymentpackage_WebhookPaymentEntity__Output>
  }
}

