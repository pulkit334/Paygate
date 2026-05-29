import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { ChatRequest as _randomPackage_ChatRequest, ChatRequest__Output as _randomPackage_ChatRequest__Output } from './randomPackage/ChatRequest';
import type { ChatResponse as _randomPackage_ChatResponse, ChatResponse__Output as _randomPackage_ChatResponse__Output } from './randomPackage/ChatResponse';
import type { NUmberResponse as _randomPackage_NUmberResponse, NUmberResponse__Output as _randomPackage_NUmberResponse__Output } from './randomPackage/NUmberResponse';
import type { NumberRequest as _randomPackage_NumberRequest, NumberRequest__Output as _randomPackage_NumberRequest__Output } from './randomPackage/NumberRequest';
import type { PingRequest as _randomPackage_PingRequest, PingRequest__Output as _randomPackage_PingRequest__Output } from './randomPackage/PingRequest';
import type { PongResponse as _randomPackage_PongResponse, PongResponse__Output as _randomPackage_PongResponse__Output } from './randomPackage/PongResponse';
import type { RandomClient as _randomPackage_RandomClient, RandomDefinition as _randomPackage_RandomDefinition } from './randomPackage/Random';
import type { TodoReq as _randomPackage_TodoReq, TodoReq__Output as _randomPackage_TodoReq__Output } from './randomPackage/TodoReq';
import type { TodoRes as _randomPackage_TodoRes, TodoRes__Output as _randomPackage_TodoRes__Output } from './randomPackage/TodoRes';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  randomPackage: {
    ChatRequest: MessageTypeDefinition<_randomPackage_ChatRequest, _randomPackage_ChatRequest__Output>
    ChatResponse: MessageTypeDefinition<_randomPackage_ChatResponse, _randomPackage_ChatResponse__Output>
    NUmberResponse: MessageTypeDefinition<_randomPackage_NUmberResponse, _randomPackage_NUmberResponse__Output>
    NumberRequest: MessageTypeDefinition<_randomPackage_NumberRequest, _randomPackage_NumberRequest__Output>
    PingRequest: MessageTypeDefinition<_randomPackage_PingRequest, _randomPackage_PingRequest__Output>
    PongResponse: MessageTypeDefinition<_randomPackage_PongResponse, _randomPackage_PongResponse__Output>
    Random: SubtypeConstructor<typeof grpc.Client, _randomPackage_RandomClient> & { service: _randomPackage_RandomDefinition }
    TodoReq: MessageTypeDefinition<_randomPackage_TodoReq, _randomPackage_TodoReq__Output>
    TodoRes: MessageTypeDefinition<_randomPackage_TodoRes, _randomPackage_TodoRes__Output>
  }
}

