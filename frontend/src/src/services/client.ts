import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const code = error?.response?.data?.code
    const originalRequest = error.config

    if (status === 429) {
      window.location.replace('/')
      return Promise.reject(error)
    }

    if (status === 401 && code === 'ACCESS_TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await api.post('/auth/refresh')
        return api(originalRequest)
      } catch {
        window.location.replace('/')
        return Promise.reject(error)
      }
    }

    if (status === 401) {
      window.location.replace('/')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  },
)

export default api
