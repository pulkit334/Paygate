import { api } from './client'

export const ANALYTICS = {
  SUMMARY: '/analytics/summary',
  DAILY: '/analytics/daily',
}

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
  try {
    const response = await api.get(ANALYTICS.SUMMARY)
    return response.data
  } catch (err) {
    throw err
  }
}

export const getDailyVolume = async (days: number = 7): Promise<DailyVolume[]> => {
  try {
    const response = await api.get(ANALYTICS.DAILY, { params: { days } })
    return response.data
  } catch (err) {
    throw err
  }
}
