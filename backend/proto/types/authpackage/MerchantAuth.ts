// Original file: proto/merchant.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { AuthLoginReq as _authpackage_AuthLoginReq, AuthLoginReq__Output as _authpackage_AuthLoginReq__Output } from '../authpackage/AuthLoginReq';
import type { AuthLoginRes as _authpackage_AuthLoginRes, AuthLoginRes__Output as _authpackage_AuthLoginRes__Output } from '../authpackage/AuthLoginRes';
import type { AuthRegisterReq as _authpackage_AuthRegisterReq, AuthRegisterReq__Output as _authpackage_AuthRegisterReq__Output } from '../authpackage/AuthRegisterReq';
import type { AuthRegisterRes as _authpackage_AuthRegisterRes, AuthRegisterRes__Output as _authpackage_AuthRegisterRes__Output } from '../authpackage/AuthRegisterRes';
import type { ValidateRequest as _authpackage_ValidateRequest, ValidateRequest__Output as _authpackage_ValidateRequest__Output } from '../authpackage/ValidateRequest';
import type { ValidateResponse as _authpackage_ValidateResponse, ValidateResponse__Output as _authpackage_ValidateResponse__Output } from '../authpackage/ValidateResponse';

export interface MerchantAuthClient extends grpc.Client {
  Auth(argument: _authpackage_AuthRegisterReq, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_AuthRegisterRes__Output>): grpc.ClientUnaryCall;
  Auth(argument: _authpackage_AuthRegisterReq, metadata: grpc.Metadata, callback: grpc.requestCallback<_authpackage_AuthRegisterRes__Output>): grpc.ClientUnaryCall;
  Auth(argument: _authpackage_AuthRegisterReq, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_AuthRegisterRes__Output>): grpc.ClientUnaryCall;
  Auth(argument: _authpackage_AuthRegisterReq, callback: grpc.requestCallback<_authpackage_AuthRegisterRes__Output>): grpc.ClientUnaryCall;
  auth(argument: _authpackage_AuthRegisterReq, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_AuthRegisterRes__Output>): grpc.ClientUnaryCall;
  auth(argument: _authpackage_AuthRegisterReq, metadata: grpc.Metadata, callback: grpc.requestCallback<_authpackage_AuthRegisterRes__Output>): grpc.ClientUnaryCall;
  auth(argument: _authpackage_AuthRegisterReq, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_AuthRegisterRes__Output>): grpc.ClientUnaryCall;
  auth(argument: _authpackage_AuthRegisterReq, callback: grpc.requestCallback<_authpackage_AuthRegisterRes__Output>): grpc.ClientUnaryCall;
  
  Login(argument: _authpackage_AuthLoginReq, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_AuthLoginRes__Output>): grpc.ClientUnaryCall;
  Login(argument: _authpackage_AuthLoginReq, metadata: grpc.Metadata, callback: grpc.requestCallback<_authpackage_AuthLoginRes__Output>): grpc.ClientUnaryCall;
  Login(argument: _authpackage_AuthLoginReq, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_AuthLoginRes__Output>): grpc.ClientUnaryCall;
  Login(argument: _authpackage_AuthLoginReq, callback: grpc.requestCallback<_authpackage_AuthLoginRes__Output>): grpc.ClientUnaryCall;
  login(argument: _authpackage_AuthLoginReq, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_AuthLoginRes__Output>): grpc.ClientUnaryCall;
  login(argument: _authpackage_AuthLoginReq, metadata: grpc.Metadata, callback: grpc.requestCallback<_authpackage_AuthLoginRes__Output>): grpc.ClientUnaryCall;
  login(argument: _authpackage_AuthLoginReq, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_AuthLoginRes__Output>): grpc.ClientUnaryCall;
  login(argument: _authpackage_AuthLoginReq, callback: grpc.requestCallback<_authpackage_AuthLoginRes__Output>): grpc.ClientUnaryCall;
  
  ValidateApiKey(argument: _authpackage_ValidateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_ValidateResponse__Output>): grpc.ClientUnaryCall;
  ValidateApiKey(argument: _authpackage_ValidateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_authpackage_ValidateResponse__Output>): grpc.ClientUnaryCall;
  ValidateApiKey(argument: _authpackage_ValidateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_ValidateResponse__Output>): grpc.ClientUnaryCall;
  ValidateApiKey(argument: _authpackage_ValidateRequest, callback: grpc.requestCallback<_authpackage_ValidateResponse__Output>): grpc.ClientUnaryCall;
  validateApiKey(argument: _authpackage_ValidateRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_ValidateResponse__Output>): grpc.ClientUnaryCall;
  validateApiKey(argument: _authpackage_ValidateRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_authpackage_ValidateResponse__Output>): grpc.ClientUnaryCall;
  validateApiKey(argument: _authpackage_ValidateRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_authpackage_ValidateResponse__Output>): grpc.ClientUnaryCall;
  validateApiKey(argument: _authpackage_ValidateRequest, callback: grpc.requestCallback<_authpackage_ValidateResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface MerchantAuthHandlers extends grpc.UntypedServiceImplementation {
  Auth: grpc.handleUnaryCall<_authpackage_AuthRegisterReq__Output, _authpackage_AuthRegisterRes>;
  
  Login: grpc.handleUnaryCall<_authpackage_AuthLoginReq__Output, _authpackage_AuthLoginRes>;
  
  ValidateApiKey: grpc.handleUnaryCall<_authpackage_ValidateRequest__Output, _authpackage_ValidateResponse>;
  
}

export interface MerchantAuthDefinition extends grpc.ServiceDefinition {
  Auth: MethodDefinition<_authpackage_AuthRegisterReq, _authpackage_AuthRegisterRes, _authpackage_AuthRegisterReq__Output, _authpackage_AuthRegisterRes__Output>
  Login: MethodDefinition<_authpackage_AuthLoginReq, _authpackage_AuthLoginRes, _authpackage_AuthLoginReq__Output, _authpackage_AuthLoginRes__Output>
  ValidateApiKey: MethodDefinition<_authpackage_ValidateRequest, _authpackage_ValidateResponse, _authpackage_ValidateRequest__Output, _authpackage_ValidateResponse__Output>
}
