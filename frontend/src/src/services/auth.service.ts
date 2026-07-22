import { isAxiosError } from 'axios'
import { MerchantApi } from './client'

export const AUTH = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  callbackUrl?: string
}

export interface RegisterResponse {
  publicKey: string
  secretKey: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  appId: string
  userApps: string[]
  tokenExpiresAt: number
}

export interface AppInfo {
  appId: string
  isActive: boolean
  issuedAt: number
  expiresAt: number
  expired: boolean
}

export interface SessionResponse {
  authenticated: boolean
  activeApp: string | null
  activeAppExpired: boolean
  userApps: AppInfo[]
}

export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await MerchantApi.post(AUTH.REGISTER, data)
    return response.data
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err.response?.data?.code
      const status = err.response?.status
      if (code === 'USER_EXISTS' || status === 409) {
        throw new Error('An account with this email already exists', { cause: err })
      }
    }
    throw err
  }
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await MerchantApi.post(AUTH.LOGIN, data)
    return response.data
  } catch (err) {
    if (isAxiosError(err)) {
      const serverMessage = err.response?.data?.error 
      if (serverMessage) {
        throw new Error(serverMessage, { cause: err })
      }
    }
    throw err
  }
}

export const getSession = async (): Promise<SessionResponse> => {
  try {
    const response = await MerchantApi.get('/session')
    return response.data
  } catch {
    return { authenticated: false, activeApp: null, activeAppExpired: false, userApps: [] }
  }
}

export const switchApp = async (appId: string): Promise<{ success: boolean; activeApp: string; expiresAt: number }> => {
  const response = await MerchantApi.post('/session/switch', { appId })
  return response.data
}

export const logoutSession = async (): Promise<void> => {
  await MerchantApi.post('/session/logout')
}

export const logoutApp = async (appId: string) => {
  const response = await MerchantApi.delete(`/session/apps/${appId}`)
  return response.data
}
