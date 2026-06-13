export interface IDailyVolume {
  date: string;
  amount: number;
}

export interface ISummary {
  totalReceived: number;
  totalTransactions: number;
  successRate: number;
  lastPaymentAt: string | null;
}
export interface IPayment {
    id: string
  amount: number
  currency: string
  status: string
  customerEmail: string
  createdAt: string
  transactionId: string
  razorpayOrderId: string
  metadata: Record<string, string>
  failureReason?: string
}