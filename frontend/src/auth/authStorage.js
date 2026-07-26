const AUTH_PROFILE_KEY = 'ithelpdesk_auth_profile'

export function getAuthProfile() {
  const storedValue =
    localStorage.getItem(AUTH_PROFILE_KEY) ??
    sessionStorage.getItem(AUTH_PROFILE_KEY)

  if (!storedValue) {
    return null
  }

  try {
    return JSON.parse(storedValue)
  } catch {
    clearAuthProfile()
    return null
  }
}

export function saveAuthProfile(profile, rememberMe = false) {
  clearAuthProfile()

  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile))
}

export function clearAuthProfile() {
  localStorage.removeItem(AUTH_PROFILE_KEY)
  sessionStorage.removeItem(AUTH_PROFILE_KEY)
}
