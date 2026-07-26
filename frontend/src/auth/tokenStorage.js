const TOKEN_KEY = 'ithelpdesk_access_token'

export function getAccessToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ??
    sessionStorage.getItem(TOKEN_KEY)
  )
}

export function saveAccessToken(token, rememberMe = false) {
  clearAccessToken()

  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}
