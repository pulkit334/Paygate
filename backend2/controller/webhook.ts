//if the date come then ok other wise  Present Date is Ok
//if CurrentDate-> then use the mongoDb aggreagation Pipline
//total me se succesded find out kar lo and Failed FindOut Kar lo
//TotalAttempt's-> Total Present-> the date specified
//
import { Request, Response, NextFunction } from "express";
import webhook_del from "../Modals/WebhookDelivery";

export const GetWebhookHistory = async (
  req: Request,
  Res: Response,
  next: NextFunction,
) => {
  try {
    const { from, appId, limit = "50", offset = "0" } = req.query;

    if (!appId) {
      return Res.status(400).json({ success: false, message: "appId is required" });
    }
    const filterdata: any = { appId };
    if (from) {
      filterdata.sentAt = { $gte: new Date(from as string) };
    }
    const transctionData =await  webhook_del
      .find(filterdata)
      .sort({ sentAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));
    const total = await webhook_del.countDocuments(filterdata);
    return Res.status(201).json({
      success : true ,
      data: transctionData,
      total,    
    });
  } catch (err: any) {
    next(err);
  }
};
