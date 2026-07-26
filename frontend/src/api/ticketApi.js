import httpClient from './httpClient'

export async function getTickets() {
  const response = await httpClient.get('/tickets')
  return response.data
}

export async function getTicketById(ticketId) {
  const response = await httpClient.get(`/tickets/${ticketId}`)
  return response.data
}

export async function createTicket(ticketData) {
  const response = await httpClient.post('/tickets', ticketData)
  return response.data
}

export async function updateTicket(ticketId, ticketData) {
  const response = await httpClient.put(
    `/tickets/${ticketId}`,
    ticketData,
  )

  return response.data
}

export async function deleteTicket(ticketId) {
  await httpClient.delete(`/tickets/${ticketId}`)
}
