import httpClient from './httpClient'

export async function getManagerTeam() {
  const response = await httpClient.get('/manager/team')
  return response.data
}
