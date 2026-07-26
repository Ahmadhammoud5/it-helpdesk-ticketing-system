import axios from 'axios'

import {
  clearAccessToken,
  getAccessToken,
} from '../auth/tokenStorage'

const httpClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
      window.location.assign('/login')
    }

    return Promise.reject(error)
  },
)

export default httpClient
