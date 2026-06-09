import client from './client'

export interface WebhookDelivery {
  id: string
  targetUrl: string
  status: string
  attemptNumber: number
  httpResponseCode: number
  createdAt: string
}

export const getDeliveries = async (): Promise<WebhookDelivery[]> => {
  const response = await client.get('/webhooks/deliveries')
  return response.data
}

export const retryDelivery = async (id: string): Promise<void> => {
  await client.post(`/webhooks/retry/${id}`)
}
