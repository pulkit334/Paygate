import client from './client'

export interface KeysResponse {
  publicKey: string
  secretKey: string
}

export interface AppSettings {
  callbackUrl: string
  publicKey: string
}

export const rotateKeys = async (): Promise<KeysResponse> => {
  const response = await client.post('/apps/regenerate-keys')
  return response.data
}

export const updateCallbackUrl = async (callbackUrl: string): Promise<void> => {
  await client.put('/apps/callback-url', { callbackUrl })
}

export const getSettings = async (): Promise<AppSettings> => {
  const response = await client.get('/apps/settings')
  return response.data
}
