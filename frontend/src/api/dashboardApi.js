import httpClient from './httpClient'

export async function getDashboardSummary() {
  const response = await httpClient.get(
    '/dashboard/summary',
  )

  return response.data
}