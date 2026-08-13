import {
  useMemo,
  useState,
} from 'react'

import { login as loginRequest } from '../api/authApi'
import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from './tokenStorage'
import {
  clearAuthProfile,
  getAuthProfile,
  saveAuthProfile,
} from './authStorage'
import { AuthContext } from './authContextValue'

function getInitialUser() {
  const profile = getAuthProfile()
  const token = getAccessToken()

  if (!profile || !token) {
    return null
  }

  if (
    profile.expiresAtUtc &&
    new Date(profile.expiresAtUtc).getTime() <= Date.now()
  ) {
    clearAccessToken()
    clearAuthProfile()
    return null
  }

  return profile
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)
  const [authLoading, setAuthLoading] = useState(false)

  async function signIn(credentials, rememberMe = false) {
    setAuthLoading(true)

    try {
      const response = await loginRequest(credentials)

      saveAccessToken(response.accessToken, rememberMe)

      const profile = {
        userId: response.userId,
        fullName: response.fullName,
        email: response.email,
        roles: response.roles ?? [],
        expiresAtUtc: response.expiresAtUtc,
      }

      saveAuthProfile(profile, rememberMe)
      setUser(profile)

      return profile
    } finally {
      setAuthLoading(false)
    }
  }

  function signOut() {
    clearAccessToken()
    clearAuthProfile()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user && getAccessToken()),
      signIn,
      signOut,
    }),
    [user, authLoading],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
