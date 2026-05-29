import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { ProtoGrpcType } from "./src/proto/random";
import { RandomHandlers } from "./src/proto/randomPackage/Random";
import { ChatRequest } from "./src/proto/randomPackage/ChatRequest";
import { ChatResponse } from "./src/proto/randomPackage/ChatResponse";

const todoList: any = [];
const PORT = 8882;
const PROTO_FILE = "./proto/random.proto";

const PackageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE));
const grpcObj = grpc.loadPackageDefinition(PackageDef) as unknown as ProtoGrpcType;
const randomPackage = grpcObj.randomPackage;

const server = new grpc.Server();
// 
const callObjByUsername = new Map<string, grpc.ServerDuplexStream<ChatRequest, ChatResponse>>();

const handlers: RandomHandlers = {
  PingPong: (call, callback) => {
    console.log(`Received: ${call.request.message}`);
    callback(null, { message: "Pong!" });
  },

  RandomNumbers: (call) => {
    const { Maxval = 10 } = call.request;
    let r = 0;
    const id = setInterval(() => {
      r = ++r;
      call.write({ num: Math.floor(Math.random() * Maxval) });
      if (r >= 10) {
        clearInterval(id);
        call.end();
      }
    }, 500);
  },

  TodoList: (call, callback) => {
    call.on("data", (chunk) => {
      todoList.push(chunk);
      console.log(chunk);
    });
    call.on("end", () => {
      callback(null, { Todos: todoList });
    });
  },

  // Single clean chat handler — no duplication
  chat: (call) => {
    const username = call.metadata.get("username")[0] as string;

    callObjByUsername.set(username, call);
    console.log(`${username} connected. Online: ${callObjByUsername.size}`);

    call.on("data", (chatRequest: ChatRequest) => {
      const incomingMsg = chatRequest.message;
      console.log(`[${username}]: ${incomingMsg}`);

      for (const [otherUser, otherCall] of callObjByUsername) {
        if (otherUser !== username) {
          otherCall.write({ message: `[${username}]: ${incomingMsg}` });
        }
      }
    });

    call.on("end", () => {
      console.log(`${username} disconnected`);
      callObjByUsername.delete(username);
      call.end();
    });

    call.on("error", (err) => {
      console.error(`Error from ${username}:`, err);
      callObjByUsername.delete(username);
    });
  },
}; // handlers closes here — only one }

server.addService(randomPackage.Random.service, handlers);

server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error("Error:", err);
      return;
    }
    console.log(`Server running on port ${port}`);
  },
);