export interface IWebhookDelivery {
  id: string
  createdAt: string
  targetUrl: string
  status: string
  attemptNumber: number
  httpResponseCode: number
}