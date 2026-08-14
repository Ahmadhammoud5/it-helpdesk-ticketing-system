import axios from 'axios'

import {
  clearAccessToken,
  getAccessToken,
} from '../auth/tokenStorage'
import { clearAuthProfile } from '../auth/authStorage'

const httpClient = axios.create({
  baseURL: '/api',
})

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== '/login'
    ) {
      clearAccessToken()
      clearAuthProfile()
      window.location.assign('/login')
    }

    return Promise.reject(error)
  },
)

export default httpClient
