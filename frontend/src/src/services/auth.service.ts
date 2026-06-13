import { isAxiosError } from 'axios'
import { MerchantApi } from './client'

export const AUTH = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
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
  token: string
}

export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await MerchantApi.post(AUTH.REGISTER, data)
    return response.data
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err.response?.data?.code
      if (code === 'USER_EXISTS') {
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
      const code = err.response?.data?.code
      if (code === 'USER_NOT_FOUND') {
        throw new Error('Invalid email or password', { cause: err })
      }
      if (code === 'ACCOUNT_DISABLED') {
        throw new Error('Account has been disabled', { cause: err })
      }
    }
    throw err
  }
}
