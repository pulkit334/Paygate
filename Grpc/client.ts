// import path from "path";
// import * as grpc from "@grpc/grpc-js";
// import * as protoLoader from "@grpc/proto-loader";
// import { ProtoGrpcType } from "./src/proto/random";
// import { RandomClient } from "./src/proto/randomPackage/Random";
// import readline from 'readline';

// const PORT = 8882;
// const PROTO_FILE = "./proto/random.proto";

// // STEP 1 - Load proto
// const PackageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE));
// const grpcObj = grpc.loadPackageDefinition(
//   PackageDef,
// ) as unknown as ProtoGrpcType;

// // STEP 2 - Create client (connects to server)
// const client = new grpcObj.randomPackage.Random(
//   `localhost:${PORT}`,
//   grpc.credentials.createInsecure(),
// );

// const deadLine = new Date();
// deadLine.setSeconds(deadLine.getSeconds() + 5);
// client.waitForReady(deadLine, (err) => {
//   if (err) {
//     console.error(err);
//     return;
//   }
//   OnclientReady();
// });

// function OnclientReady() {
//   // client.PingPong({ message: "Hello Server!" }, (err, response) => {
//   //     if (err) {
//   //         console.error("Error:", err);
//   //         return;
//   //     }
//   //     console.log("Response from server:", response?.message);
//   // });
// //   const streams = client.randomNumbers({ Maxval: 885 });
// //   streams.on("data", (chunk) => {
// //     console.log(chunk);
// //   });
// //   streams.on("end", () => {
// //     console.log("conummnicaiton eneded");
// //   });

// // }
// // const Streams = client.todoList((err, result) => {
// //     if (err) {
// //         console.log(err);
// //         return;
// //     }
// //     console.log(result);
// // });

// const username = process.argv[2];
// if(!username){
//   console.error("usage Npx tsx client.ts");
//   process.exit(1);
// }


// const meta = new grpc.metadata();
// meta.set("username",username);
// const call = client.chat(meta);
// call.on("data",(res : ChatResponse)=>{
//   process.stdout.write("> ";)
// })
// // // Write OUTSIDE callback
// // Streams.write({ Todo: "walk the wife", status: "Never" });
// // Streams.write({ Todo: "walk the dog", status: "Never" });
// // Streams.write({ Todo: "hello", status: "Never" });
// // Streams.write({ Todo: "walk the wife", status: "Never" });
// // Streams.write({ Todo: "walk the wife", status: "Never" });

// // End OUTSIDE callback
// Streams.end();
// }
import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as readline from "readline";
import { ProtoGrpcType } from "./src/proto/random";
import { ChatRequest } from "./src/proto/randomPackage/ChatRequest";
import { ChatResponse } from "./src/proto/randomPackage/ChatResponse";

const PORT = 8882;
const PROTO_FILE = "./proto/random.proto";

// Load the proto file — this is the contract/schema between client and server
// path.resolve converts relative path to absolute so it works from any directory
const PackageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE));

// Convert the raw proto definition into a usable grpc object with typed methods
const grpcObj = grpc.loadPackageDefinition(PackageDef) as unknown as ProtoGrpcType;

// Create a CLIENT instance that points to the server address
// This is like "dialing" the server — not connected yet, just ready to call
const client = new grpcObj.randomPackage.Random(
  `0.0.0.0:${PORT}`,
  grpc.credentials.createInsecure() // no SSL — fine for local development
);

// Read username from terminal argument: npx tsx client.ts Alice
// process.argv = ["node", "client.ts", "Alice"]
//                    0         1           2       ← index
const username = process.argv[2];
if (!username) {
  console.error("Usage: npx tsx client.ts <username>");
  process.exit(1); // stop the program if no username given
}

// Metadata = headers for gRPC, sent at connection time BEFORE any message
// This is how the server knows WHO is connecting without putting it in every message
const meta = new grpc.Metadata();
meta.set("username", username); // server reads this with call.metadata.get("username")

// Open the bidirectional stream — both sides can now send/receive freely
// This is the "live wire" between this client and the server
// Passing `meta` here sends the username to server immediately on connect
const call = client.chat(meta);

// This fires whenever the SERVER sends a message to us
// i.e. someone else sent a message and server broadcast it here
call.on("data", (res: ChatResponse) => {
  console.log(`\n${res.message}`);      // print the incoming message
  process.stdout.write("> ");           // reprint the prompt so user can keep typing
});

// This fires if the stream breaks unexpectedly (network issue, server crash etc.)
call.on("error", (err) => {
  console.error("Stream error:", err.message);
});

// This fires when the SERVER closes the connection from its side
call.on("end", () => {
  console.log("Server closed the connection");
  process.exit(0);
});

// readline lets us read what the user types in the terminal line by line
// input: process.stdin  → reads from keyboard
// output: process.stdout → prints to terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(`Connected as ${username}. Start typing!\n`);
process.stdout.write("> "); // show initial prompt

// This fires every time user presses Enter
rl.on("line", (line: string) => {
  const text = line.trim(); // remove accidental spaces/newlines

  // /quit is a clean way to disconnect instead of Ctrl+C
  // call.end() tells server "I'm done" → triggers call.on("end") on server side
  if (text === "/quit") {
    call.end();
    rl.close();
    return;
  }

  if (text) {
    // Send the typed message to the server through the open stream
    // Server receives this in call.on("data") and broadcasts to others
    call.write({ message: text } as ChatRequest);
  }

  process.stdout.write("> "); // reprint prompt after each message
});

// Fires when readline closes (Ctrl+C or /quit)
// Ensures stream is always cleanly closed even on force quit
rl.on("close", () => {
  call.end();
  process.exit(0);
});