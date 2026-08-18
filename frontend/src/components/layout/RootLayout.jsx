import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'

const routeTitles = [
  [/^\/login$/, 'Sign In'],
  [/^\/forgot-password$/, 'Reset Password'],
  [/^\/dashboard$/, 'Dashboard'],
  [/^\/tickets\/create$/, 'Create Ticket'],
  [/^\/tickets\/[^/]+\/edit$/, 'Edit Ticket'],
  [/^\/tickets\/[^/]+$/, 'Ticket Details'],
  [/^\/tickets$/, 'Tickets'],
  [/^\/admin\/users$/, 'Users'],
  [/^\/team$/, 'Team'],
  [/^\/reports$/, 'Reports'],
  [/^\/profile$/, 'Profile'],
  [/^\/access-denied$/, 'Access Denied'],
]

function RootLayout() {
  const location = useLocation()

  useEffect(() => {
    const match = routeTitles.find(([pattern]) =>
      pattern.test(location.pathname),
    )
    document.title = `${match?.[1] ?? 'Page Not Found'} | IT HelpDesk`
  }, [location.pathname])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return <Outlet />
}

export default RootLayout
