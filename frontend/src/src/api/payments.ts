import client from './client'

export interface Payment {
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

export interface PaymentsResponse {
  payments: Payment[]
  total: number
}

export const getPayments = async (params?: {
  status?: string
  from?: string
  to?: string
  limit?: number
}): Promise<PaymentsResponse> => {
  const response = await client.get('/payments', { params })
  return response.data
}
