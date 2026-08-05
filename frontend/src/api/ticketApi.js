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

export async function updateTicketStatus(
  ticketId,
  statusData,
) {
  const response = await httpClient.put(
    `/tickets/${ticketId}/status`,
    statusData,
  )

  return response.data
}

export async function getTicketTimeline(ticketId) {
  const response = await httpClient.get(
    `/tickets/${ticketId}/timeline`,
  )

  return response.data
}

export async function getTicketWorkTime(ticketId) {
  const response = await httpClient.get(
    `/tickets/${ticketId}/work-time`,
  )

  return response.data
}

export async function getTicketComments(ticketId) {
  const response = await httpClient.get(
    `/tickets/${ticketId}/comments`,
  )

  return response.data
}

export async function createTicketComment(
  ticketId,
  commentData,
) {
  const response = await httpClient.post(
    `/tickets/${ticketId}/comments`,
    commentData,
  )

  return response.data
}

export async function updateTicketComment(
  ticketId,
  commentId,
  commentData,
) {
  const response = await httpClient.put(
    `/tickets/${ticketId}/comments/${commentId}`,
    commentData,
  )

  return response.data
}

export async function deleteTicketComment(
  ticketId,
  commentId,
) {
  await httpClient.delete(
    `/tickets/${ticketId}/comments/${commentId}`,
  )
}

export async function getSupportAgents() {
  const response = await httpClient.get(
    '/tickets/support-agents',
  )

  return response.data
}

export async function assignTicket(
  ticketId,
  assignmentData,
) {
  const response = await httpClient.post(
    `/tickets/${ticketId}/assign`,
    assignmentData,
  )

  return response.data
}

export async function unassignTicket(
  ticketId,
  assignmentData = {},
) {
  const response = await httpClient.post(
    `/tickets/${ticketId}/unassign`,
    assignmentData,
  )

  return response.data
}

export async function getTicketAssignmentHistory(
  ticketId,
) {
  const response = await httpClient.get(
    `/tickets/${ticketId}/assignment-history`,
  )

  return response.data
}
