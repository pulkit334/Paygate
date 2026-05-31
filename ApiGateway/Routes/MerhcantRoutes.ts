import express, { Request, Response } from "express";
import { merchantClient } from "../GrpcRef/Grpc";
const router = express.Router();

router.post("/login", async (req: Request, res: Response) => {
  //Payload-> Proxy
  const grpcPayload = {
    ownerEmail: req.body.email,
    password: req.body.password,
  };

  merchantClient.Login(grpcPayload, (err: any, Response: any) => {
    if (err) {
      return res.status(401).json({ success: false, error: err.message });
    }

    // Step 4: Get Back and Send the Response Back
    res.status(200).json(Response);
  });
});
router.post("/register", (req: Request, res: Response) => {
  const grpcPayload = {
    name: req.body.name,
    ownerEmail: req.body.email,
    password: req.body.password,
    callbackUrl: req.body.callbackUrl || "",
  };

  merchantClient.Auth(grpcPayload, (err: any, response: any) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.status(201).json(response);
  });
});

export default router;
