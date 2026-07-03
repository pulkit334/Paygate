import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";
import mongoose from "mongoose";
import Transaction from "../models/transction";

export const GetAnalyticsSummary = async (
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

    const [result] = await Transaction.aggregate([
      {
        $match: {
          appId: new mongoose.Types.ObjectId(appId),
          status: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalReceived: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
          lastPaymentAt: { $max: "$createdAt" },
        },
      },
    ]);

    const totalReceived = result?.totalReceived ?? 0;
    const totalTransactions = result?.totalTransactions ?? 0;
    const lastPaymentAt = result?.lastPaymentAt ?? null;

    const successRate = totalTransactions > 0 ? 100 : 0;

    callback(null, {
      totalReceived,
      totalTransactions,
      successRate,
      lastPaymentAt: lastPaymentAt ? lastPaymentAt.toISOString() : "",
    });
  } catch (err) {
    callback({
      code: status.INTERNAL,
      message: "Failed to fetch analytics summary",
    });
  }
};

export const DashboardAnalytics = async (
  call: ServerUnaryCall<any, any>,
  callback: sendUnaryData<any>,
) => {
  try {
    const appId = call.request.appId;
    if (!appId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "appId is required",
      });
    }
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 6);
    fromDate.setHours(0, 0, 0, 0);

    const TransactionResult = await Transaction.aggregate([
      {
        $match: {
          appId: new mongoose.Types.ObjectId(appId),
          createdAt: {
            $gte: fromDate,
            $lte: new Date(),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },
          count: {
            $sum: 1,
          },
          amount: {
            $sum: "$amount",
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          amount: 1,
          count: 1,
        },
      },
      {
        $sort: {
          date: 1,
        },
      },
    ]);

    callback(null, { days: TransactionResult });
  } catch (err) {
    callback({
      code: status.INTERNAL,
      message: "Failed to fetch analytics",
    });
  }
};
