import {
  useCallback,
  useMemo,
  useState,
} from 'react'

import {
  getCurrentUser,
  login as loginRequest,
} from '../api/authApi'
import {
  clearAccessToken,
  getAccessToken,
  isAccessTokenRemembered,
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

  const signIn = useCallback(async (
    credentials,
    rememberMe = false,
  ) => {
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
        hasProfilePhoto:
          response.hasProfilePhoto === true,
        avatarVersion: 0,
      }

      saveAuthProfile(profile, rememberMe)
      setUser(profile)

      return profile
    } finally {
      setAuthLoading(false)
    }
  }, [])

  const signOut = useCallback(() => {
    clearAccessToken()
    clearAuthProfile()
    setUser(null)
  }, [])

  const updateCurrentUser = useCallback((updates) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser
      }

      const nextUser = {
        ...currentUser,
        ...updates,
      }

      saveAuthProfile(
        nextUser,
        isAccessTokenRemembered(),
      )

      return nextUser
    })
  }, [])

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser()

    updateCurrentUser({
      userId: currentUser.userId,
      fullName: currentUser.fullName,
      email: currentUser.email,
      roles: currentUser.roles ?? [],
      hasProfilePhoto:
        currentUser.hasProfilePhoto === true,
    })

    return currentUser
  }, [updateCurrentUser])

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user && getAccessToken()),
      signIn,
      signOut,
      updateCurrentUser,
      refreshUser,
    }),
    [
      user,
      authLoading,
      signIn,
      signOut,
      updateCurrentUser,
      refreshUser,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
