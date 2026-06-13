import { api } from './client'

export const WEBHOOKS = {
  DELIVERIES: '/webhooks/deliveries',
  RETRY: '/webhooks/retry',
}

export interface WebhookDelivery {
  id: string
  targetUrl: string
  status: string
  attemptNumber: number
  httpResponseCode: number
  createdAt: string
}

export const getDeliveries = async (params?: { date?: string }): Promise<WebhookDelivery[]> => {
  try {
    const response = await api.get(WEBHOOKS.DELIVERIES, { params })
    return response.data
  } catch (err) {
    throw err
  }
}

export const retryDelivery = async (id: string): Promise<void> => {
  try {
    await api.post(`${WEBHOOKS.RETRY}/${id}`)
  } catch (err) {
    const code = (err as any)?.response?.data?.code
    if (code === 'RETRY_FAILED') {
      throw new Error('Failed to retry webhook delivery')
    }
    throw err
  }
}
