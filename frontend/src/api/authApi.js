import httpClient from './httpClient'

export async function login(credentials) {
  const response = await httpClient.post('/auth/login', credentials)
  return response.data
}
