import httpClient from './httpClient'

export async function getCategories() {
  const response = await httpClient.get('/categories')
  return response.data
}

export async function getPriorities() {
  const response = await httpClient.get('/priorities')
  return response.data
}

export async function getStatuses() {
  const response = await httpClient.get('/statuses')
  return response.data
}
