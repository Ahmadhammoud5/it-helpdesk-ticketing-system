import httpClient from './httpClient'

export async function getUsers() {
  const response = await httpClient.get('/admin/users')
  return response.data
}

export async function createUser(userData) {
  const response = await httpClient.post(
    '/admin/users',
    userData,
  )

  return response.data
}

export async function updateUserRole(userId, role) {
  const response = await httpClient.put(
    `/admin/users/${userId}/role`,
    { role },
  )

  return response.data
}

export async function updateUserStatus(userId, isActive) {
  const response = await httpClient.put(
    `/admin/users/${userId}/status`,
    { isActive },
  )

  return response.data
}
