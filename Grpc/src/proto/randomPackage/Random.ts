// Original file: proto/random.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { ChatRequest as _randomPackage_ChatRequest, ChatRequest__Output as _randomPackage_ChatRequest__Output } from '../randomPackage/ChatRequest';
import type { ChatResponse as _randomPackage_ChatResponse, ChatResponse__Output as _randomPackage_ChatResponse__Output } from '../randomPackage/ChatResponse';
import type { NUmberResponse as _randomPackage_NUmberResponse, NUmberResponse__Output as _randomPackage_NUmberResponse__Output } from '../randomPackage/NUmberResponse';
import type { NumberRequest as _randomPackage_NumberRequest, NumberRequest__Output as _randomPackage_NumberRequest__Output } from '../randomPackage/NumberRequest';
import type { PingRequest as _randomPackage_PingRequest, PingRequest__Output as _randomPackage_PingRequest__Output } from '../randomPackage/PingRequest';
import type { PongResponse as _randomPackage_PongResponse, PongResponse__Output as _randomPackage_PongResponse__Output } from '../randomPackage/PongResponse';
import type { TodoReq as _randomPackage_TodoReq, TodoReq__Output as _randomPackage_TodoReq__Output } from '../randomPackage/TodoReq';
import type { TodoRes as _randomPackage_TodoRes, TodoRes__Output as _randomPackage_TodoRes__Output } from '../randomPackage/TodoRes';

export interface RandomClient extends grpc.Client {
  Chat(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_randomPackage_ChatRequest, _randomPackage_ChatResponse__Output>;
  Chat(options?: grpc.CallOptions): grpc.ClientDuplexStream<_randomPackage_ChatRequest, _randomPackage_ChatResponse__Output>;
  chat(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_randomPackage_ChatRequest, _randomPackage_ChatResponse__Output>;
  chat(options?: grpc.CallOptions): grpc.ClientDuplexStream<_randomPackage_ChatRequest, _randomPackage_ChatResponse__Output>;
  
  PingPong(argument: _randomPackage_PingRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_randomPackage_PongResponse__Output>): grpc.ClientUnaryCall;
  PingPong(argument: _randomPackage_PingRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_randomPackage_PongResponse__Output>): grpc.ClientUnaryCall;
  PingPong(argument: _randomPackage_PingRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_randomPackage_PongResponse__Output>): grpc.ClientUnaryCall;
  PingPong(argument: _randomPackage_PingRequest, callback: grpc.requestCallback<_randomPackage_PongResponse__Output>): grpc.ClientUnaryCall;
  pingPong(argument: _randomPackage_PingRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_randomPackage_PongResponse__Output>): grpc.ClientUnaryCall;
  pingPong(argument: _randomPackage_PingRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_randomPackage_PongResponse__Output>): grpc.ClientUnaryCall;
  pingPong(argument: _randomPackage_PingRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_randomPackage_PongResponse__Output>): grpc.ClientUnaryCall;
  pingPong(argument: _randomPackage_PingRequest, callback: grpc.requestCallback<_randomPackage_PongResponse__Output>): grpc.ClientUnaryCall;
  
  RandomNumbers(argument: _randomPackage_NumberRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_randomPackage_NUmberResponse__Output>;
  RandomNumbers(argument: _randomPackage_NumberRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_randomPackage_NUmberResponse__Output>;
  randomNumbers(argument: _randomPackage_NumberRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_randomPackage_NUmberResponse__Output>;
  randomNumbers(argument: _randomPackage_NumberRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_randomPackage_NUmberResponse__Output>;
  
  TodoList(metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_randomPackage_TodoRes__Output>): grpc.ClientWritableStream<_randomPackage_TodoReq>;
  TodoList(metadata: grpc.Metadata, callback: grpc.requestCallback<_randomPackage_TodoRes__Output>): grpc.ClientWritableStream<_randomPackage_TodoReq>;
  TodoList(options: grpc.CallOptions, callback: grpc.requestCallback<_randomPackage_TodoRes__Output>): grpc.ClientWritableStream<_randomPackage_TodoReq>;
  TodoList(callback: grpc.requestCallback<_randomPackage_TodoRes__Output>): grpc.ClientWritableStream<_randomPackage_TodoReq>;
  todoList(metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_randomPackage_TodoRes__Output>): grpc.ClientWritableStream<_randomPackage_TodoReq>;
  todoList(metadata: grpc.Metadata, callback: grpc.requestCallback<_randomPackage_TodoRes__Output>): grpc.ClientWritableStream<_randomPackage_TodoReq>;
  todoList(options: grpc.CallOptions, callback: grpc.requestCallback<_randomPackage_TodoRes__Output>): grpc.ClientWritableStream<_randomPackage_TodoReq>;
  todoList(callback: grpc.requestCallback<_randomPackage_TodoRes__Output>): grpc.ClientWritableStream<_randomPackage_TodoReq>;
  
}

export interface RandomHandlers extends grpc.UntypedServiceImplementation {
  Chat: grpc.handleBidiStreamingCall<_randomPackage_ChatRequest__Output, _randomPackage_ChatResponse>;
  
  PingPong: grpc.handleUnaryCall<_randomPackage_PingRequest__Output, _randomPackage_PongResponse>;
  
  RandomNumbers: grpc.handleServerStreamingCall<_randomPackage_NumberRequest__Output, _randomPackage_NUmberResponse>;
  
  TodoList: grpc.handleClientStreamingCall<_randomPackage_TodoReq__Output, _randomPackage_TodoRes>;
  
}

export interface RandomDefinition extends grpc.ServiceDefinition {
  Chat: MethodDefinition<_randomPackage_ChatRequest, _randomPackage_ChatResponse, _randomPackage_ChatRequest__Output, _randomPackage_ChatResponse__Output>
  PingPong: MethodDefinition<_randomPackage_PingRequest, _randomPackage_PongResponse, _randomPackage_PingRequest__Output, _randomPackage_PongResponse__Output>
  RandomNumbers: MethodDefinition<_randomPackage_NumberRequest, _randomPackage_NUmberResponse, _randomPackage_NumberRequest__Output, _randomPackage_NUmberResponse__Output>
  TodoList: MethodDefinition<_randomPackage_TodoReq, _randomPackage_TodoRes, _randomPackage_TodoReq__Output, _randomPackage_TodoRes__Output>
}
