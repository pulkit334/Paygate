import { api } from './client'

export const APPS = {
  REGENERATE_KEYS: '/apps/regenerate-keys',
  CALLBACK_URL: '/apps/callback-url',
  SETTINGS: '/apps/settings',
}

export interface KeysResponse {
  publicKey: string
  secretKey: string
}

export interface AppSettings {
  callbackUrl: string
  publicKey: string
}

export const rotateKeys = async (): Promise<KeysResponse> => {
  try {
    const response = await api.post(APPS.REGENERATE_KEYS)
    return response.data
  } catch (err) {
    throw err
  }
}

export const updateCallbackUrl = async (callbackUrl: string): Promise<void> => {
  try {
    await api.put(APPS.CALLBACK_URL, { callbackUrl })
  } catch (err) {
    const code = (err as any)?.response?.data?.code
    if (code === 'INVALID_CALLBACK_URL') {
      throw new Error('Invalid callback URL format')
    }
    throw err
  }
}

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const response = await api.get(APPS.SETTINGS)
    return response.data
  } catch (err) {
    throw err
  }
}
