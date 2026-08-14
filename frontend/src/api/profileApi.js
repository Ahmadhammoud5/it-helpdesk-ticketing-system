import httpClient from './httpClient'

export async function getProfile() {
  const response = await httpClient.get('/profile')
  return response.data
}

export async function updateProfile(details) {
  const response = await httpClient.put('/profile', details)
  return response.data
}

export async function uploadProfilePhoto(photo) {
  const formData = new FormData()
  formData.append('photo', photo)

  const response = await httpClient.post(
    '/profile/photo',
    formData,
  )

  return response.data
}

export async function deleteProfilePhoto() {
  await httpClient.delete('/profile/photo')
}

export async function getProfilePhoto() {
  const response = await httpClient.get('/profile/photo', {
    responseType: 'blob',
  })

  return response.data
}

export async function changePassword(details) {
  const response = await httpClient.post(
    '/profile/change-password',
    details,
  )

  return response.data
}
