import httpClient from './httpClient'

export async function login(credentials) {
  const response = await httpClient.post('/auth/login', credentials)
  return response.data
}

export async function forgotPassword(email) {
  const response = await httpClient.post('/auth/forgot-password', {
    email,
  })

  return response.data
}

export async function resetPassword(details) {
  const response = await httpClient.post('/auth/reset-password', details)
  return response.data
}