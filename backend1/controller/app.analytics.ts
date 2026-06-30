import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";
import mongoose from "mongoose";
import Transaction from "../models/transction";

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
