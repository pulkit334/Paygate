import { sendUnaryData, ServerUnaryCall, status } from "@grpc/grpc-js";
import mongoose from "mongoose";
import Transaction from "../models/transction";
import Balance from "../models/balance";

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

    const [allResult, paidResult, balanceResult] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            appId: new mongoose.Types.ObjectId(appId),
          },
        },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
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
            paidCount: { $sum: 1 },
            lastPaymentAt: { $max: "$createdAt" },
          },
        },
      ]),
      Balance.findOne({ appId: new mongoose.Types.ObjectId(appId) }),
    ]);

    const totalTransactions = allResult[0]?.totalTransactions ?? 0;
    const totalReceived = paidResult[0]?.totalReceived ?? 0;
    const paidCount = paidResult[0]?.paidCount ?? 0;
    const lastPaymentAt = paidResult[0]?.lastPaymentAt ?? null;
    const currentBalance = balanceResult?.amount ?? 0;




    const successRate = totalTransactions > 0
      ? Math.round((paidCount / totalTransactions) * 100)
      : 0;

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
    const days = Math.max(1, parseInt(call.request.days, 10) || 7);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (days - 1));
    fromDate.setHours(0, 0, 0, 0);

    const TransactionResult = await Transaction.aggregate([
      {
        $match: {
          appId: new mongoose.Types.ObjectId(appId),
          status: "paid",
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

    const dataMap = new Map(TransactionResult.map((d) => [d.date, d]));
    
    const filled = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(fromDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      filled.push(dataMap.get(key) ?? { date: key, amount: 0, count: 0 });
    }

    callback(null, { days: filled });
  } catch (err) {
    callback({
      code: status.INTERNAL,
      message: "Failed to fetch analytics",
    });
  }
};
