import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth.store'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status
    const url = original?.url ?? ''

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error)
    }

    if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
      if (url.includes('/auth/refresh')) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    original._retry = true

    if (!refreshPromise) {
      refreshPromise = api
        .post('/auth/refresh')
        .then((res) => {
          const token = res.data.data.accessToken as string
          useAuthStore.getState().setToken(token)
          return token
        })
        .catch(() => {
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return null
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const newToken = await refreshPromise
    if (newToken) {
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    }

    return Promise.reject(error)
  },
)

export default api
