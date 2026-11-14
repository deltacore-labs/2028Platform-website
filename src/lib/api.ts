import axios from 'axios'
import { getAuth } from 'firebase/auth'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.replace(/\/$/, ''),
})

apiClient.interceptors.request.use(async (config) => {
  const user = getAuth().currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  response => response,
  error => {
    const msg = error.response?.data?.error ?? error.message
    return Promise.reject(new Error(msg))
  },
)
