import client from './client'

export interface Summary {
  totalReceived: number
  totalTransactions: number
  successRate: number
  lastPaymentAt: string
}

export interface DailyVolume {
  date: string
  amount: number
  count: number
}

export const getSummary = async (): Promise<Summary> => {
  const response = await client.get('/analytics/summary')
  return response.data
}

export const getDailyVolume = async (days: number = 7): Promise<DailyVolume[]> => {
  const response = await client.get('/analytics/daily', { params: { days } })
  return response.data
}
