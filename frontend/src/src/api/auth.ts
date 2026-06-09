import client from './client'

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
  const response = await client.post('/register', data)
  return response.data
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await client.post('/login', data)
  return response.data
}
