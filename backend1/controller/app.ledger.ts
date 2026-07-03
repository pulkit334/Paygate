import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";
import mongoose from "mongoose";
import TransactionLedger from "../models/ledgerentry";

export const GetLedger = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const { appId } = call.request;
    if (!appId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId is required",
      });
    }

    const latestEntry = await TransactionLedger.findOne({
      appId: new mongoose.Types.ObjectId(appId),
    }).sort({ createdAt: -1 });

    if (!latestEntry) {
      return callback(null, {
        success: true,
        amount: 0,
        balanceBefore: 0,
        balanceAfter: 0,
        description: "No ledger entries",
        createdAt: "",
      });
    }

    callback(null, {
      success: true,
      amount: latestEntry.amount,
      balanceBefore: latestEntry.balanceBefore,
      balanceAfter: latestEntry.balanceAfter,
      description: latestEntry.description || "",
      createdAt: latestEntry.createdAt.toISOString(),
    });
  } catch (err) {
    callback({
      code: status.INTERNAL,
      message: "Failed to fetch ledger",
    });
  }
};
