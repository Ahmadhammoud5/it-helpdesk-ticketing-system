import { Navigate, useLocation } from 'react-router'

import { useAuth } from './useAuth'
import { getRoles } from './roles'

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (
    allowedRoles?.length > 0 &&
    !getRoles(user).some((role) =>
      allowedRoles.includes(role),
    )
  ) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
