import httpClient from './httpClient'

export async function getNotifications() {
  const response = await httpClient.get('/notifications')
  return response.data
}

export async function markNotificationAsRead(notificationId) {
  const response = await httpClient.put(
    `/notifications/${notificationId}/read`,
  )

  return response.data
}

export async function markAllNotificationsAsRead() {
  const response = await httpClient.put(
    '/notifications/read-all',
  )

  return response.data
}