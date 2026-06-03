import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { AuthLoginReq as _authpackage_AuthLoginReq, AuthLoginReq__Output as _authpackage_AuthLoginReq__Output } from './authpackage/AuthLoginReq';
import type { AuthLoginRes as _authpackage_AuthLoginRes, AuthLoginRes__Output as _authpackage_AuthLoginRes__Output } from './authpackage/AuthLoginRes';
import type { AuthRegisterReq as _authpackage_AuthRegisterReq, AuthRegisterReq__Output as _authpackage_AuthRegisterReq__Output } from './authpackage/AuthRegisterReq';
import type { AuthRegisterRes as _authpackage_AuthRegisterRes, AuthRegisterRes__Output as _authpackage_AuthRegisterRes__Output } from './authpackage/AuthRegisterRes';
import type { MerchantAuthClient as _authpackage_MerchantAuthClient, MerchantAuthDefinition as _authpackage_MerchantAuthDefinition } from './authpackage/MerchantAuth';
import type { UserData as _authpackage_UserData, UserData__Output as _authpackage_UserData__Output } from './authpackage/UserData';
import type { ValidateRequest as _authpackage_ValidateRequest, ValidateRequest__Output as _authpackage_ValidateRequest__Output } from './authpackage/ValidateRequest';
import type { ValidateResponse as _authpackage_ValidateResponse, ValidateResponse__Output as _authpackage_ValidateResponse__Output } from './authpackage/ValidateResponse';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  authpackage: {
    AuthLoginReq: MessageTypeDefinition<_authpackage_AuthLoginReq, _authpackage_AuthLoginReq__Output>
    AuthLoginRes: MessageTypeDefinition<_authpackage_AuthLoginRes, _authpackage_AuthLoginRes__Output>
    AuthRegisterReq: MessageTypeDefinition<_authpackage_AuthRegisterReq, _authpackage_AuthRegisterReq__Output>
    AuthRegisterRes: MessageTypeDefinition<_authpackage_AuthRegisterRes, _authpackage_AuthRegisterRes__Output>
    MerchantAuth: SubtypeConstructor<typeof grpc.Client, _authpackage_MerchantAuthClient> & { service: _authpackage_MerchantAuthDefinition }
    UserData: MessageTypeDefinition<_authpackage_UserData, _authpackage_UserData__Output>
    ValidateRequest: MessageTypeDefinition<_authpackage_ValidateRequest, _authpackage_ValidateRequest__Output>
    ValidateResponse: MessageTypeDefinition<_authpackage_ValidateResponse, _authpackage_ValidateResponse__Output>
  }
}

