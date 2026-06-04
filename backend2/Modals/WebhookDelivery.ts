import mongoose from "mongoose";

export interface IWebhookDel {
  appId: string;
  transactionId: string;
  amount?: string;
  targetUrl: string;
  status: "success" | "failed";
  message?: string;
  payload?: object;
  signature?: string;
  responseCode?: number;
  attempt?: number;
  sentAt?: Date;
}

const Schema = new mongoose.Schema<IWebhookDel>({
  appId: { type: String, required: true },
  transactionId: { type: String, required: true },
  targetUrl: { type: String, required: true },
  payload: { type: Object },
  signature: { type: String },
  attempt: { type: Number },
  status: { type: String, enum: ["success", "failed"] },
  responseCode: { type: Number },
  sentAt: { type: Date },
});
Schema.index({ transactionId: 1 });

Schema.index({ appId: 1, status: 1 });                                   

Schema.index({ sentAt: -1 });

const webhook_del : mongoose.Model<IWebhookDel>  = mongoose.model<IWebhookDel>("webhook_del",Schema);
export default webhook_del;