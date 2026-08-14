import {
  Suspense,
  useEffect,
  useState,
} from 'react'
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router'
import {
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  TicketCheck,
  UsersRound,
  X,
} from 'lucide-react'

import { useAuth } from '../../auth/useAuth'
import {
  getRoleContext,
  getRoles,
  ROLES,
} from '../../auth/roles'
import NotificationCenter from '../notifications/NotificationCenter'
import UserAvatar from '../profile/UserAvatar'
import {
  acquireRealtimeConnection,
  releaseRealtimeConnection,
  subscribeToSessionInvalidated,
} from '../../api/notificationHub'

function getNavigation(roles) {
  const isAdmin = roles.includes(ROLES.admin)
  const isManager = roles.includes(ROLES.manager)
  const isITSupportAgent = roles.includes(
    ROLES.supportAgent,
  )

  const isEmployee = roles.includes(
    ROLES.employee,
  )

  if (isAdmin) {
    return [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: 'All tickets',
        to: '/tickets',
        icon: TicketCheck,
        end: true,
      },
      {
        label: 'Create ticket',
        to: '/tickets/create',
        icon: PlusCircle,
        end: true,
      },
      {
        label: 'Users',
        to: '/admin/users',
        icon: UsersRound,
        end: true,
      },
    ]
  }

  if (isManager) {
    return [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: 'All tickets',
        to: '/tickets',
        icon: TicketCheck,
        end: true,
      },
      {
        label: 'Team',
        to: '/team',
        icon: UsersRound,
        end: true,
      },
    ]
  }

  if (isITSupportAgent) {
    return [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: 'Assigned tickets',
        to: '/tickets',
        icon: TicketCheck,
        end: true,
      },
    ]
  }

  if (isEmployee) {
    return [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: 'Create ticket',
        to: '/tickets/create',
        icon: PlusCircle,
        end: true,
      },
      {
        label: 'My tickets',
        to: '/tickets',
        icon: TicketCheck,
        end: true,
      },
    ]
  }

  return [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: 'Tickets',
      to: '/tickets',
      icon: TicketCheck,
      end: true,
    },
  ]
}

function SidebarContent({
  closeSidebar,
  user,
  onLogout,
}) {
  const roles = getRoles(user)

  const roleContext = getRoleContext(user)

  const primaryRole = roleContext.role

  const navigation =
    getNavigation(roles)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
        <NavLink
          to="/dashboard"
          onClick={closeSidebar}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm shadow-blue-600/20">
            H
          </div>

          <div>
            <p className="font-bold text-slate-900">
              HelpDesk
            </p>

            <p className="text-[11px] text-slate-400">
              IDS · {roleContext.portalName}
            </p>
          </div>
        </NavLink>

        <button
          type="button"
          onClick={closeSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-6">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Menu
        </p>

        <div className="space-y-1">
          {navigation.map(
            ({
              label,
              to,
              icon: Icon,
              end,
            }) => (
              <NavLink
                key={label}
                to={to}
                end={end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  ].join(' ')
                }
              >
                <Icon size={18} />

                <span>
                  {label}
                </span>
              </NavLink>
            ),
          )}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <NavLink
              to="/profile"
              onClick={closeSidebar}
              aria-label="Open your profile"
              title="Open profile"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 transition hover:bg-white"
            >
              <UserAvatar user={user} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  {user?.fullName ?? 'User'}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {primaryRole}
                </p>
              </div>
            </NavLink>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-red-500"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const {
    user,
    signOut,
  } = useAuth()

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false)

  const [ticketSearch, setTicketSearch] =
    useState('')

  const roles = getRoles(user)

  const isAdmin =
    roles.includes(ROLES.admin)

  const isManager =
    roles.includes(ROLES.manager)

  const isITSupportAgent =
    roles.includes(ROLES.supportAgent)

  useEffect(() => {
    const unsubscribe =
      subscribeToSessionInvalidated((message) => {
        signOut()

        navigate('/login', {
          replace: true,
          state: { sessionMessage: message },
        })
      })

    acquireRealtimeConnection().catch((connectionError) => {
      console.error(
        'Realtime connection failed.',
        connectionError,
      )
    })

    return () => {
      unsubscribe()
      releaseRealtimeConnection()
    }
  }, [navigate, signOut])

  useEffect(() => {
    if (location.pathname !== '/tickets') {
      return
    }

    const searchValue = new URLSearchParams(
      location.search,
    ).get('search')

    setTicketSearch(searchValue ?? '')
  }, [location.pathname, location.search])

  function handleTicketSearch(event) {
    event.preventDefault()

    const value = ticketSearch.trim()

    const next = location.pathname === '/tickets'
      ? new URLSearchParams(location.search)
      : new URLSearchParams()

    if (value) {
      next.set('search', value)
    } else {
      next.delete('search')
    }

    const query = next.toString()
    navigate(query ? `/tickets?${query}` : '/tickets')
  }

  function handleLogout() {
    signOut()

    setSidebarOpen(false)

    navigate('/login', {
      replace: true,
    })
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-[270px] border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0',
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full',
        ].join(' ')}
      >
        <SidebarContent
          user={user}
          closeSidebar={() =>
            setSidebarOpen(false)
          }
          onLogout={handleLogout}
        />
      </aside>

      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-30 flex h-20 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
            className="mr-3 rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <form
            onSubmit={handleTicketSearch}
            role="search"
            className="relative hidden w-full max-w-md sm:block"
          >
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={ticketSearch}
              onChange={(event) =>
                setTicketSearch(event.target.value)
              }
              aria-label="Search tickets"
              placeholder={
                isAdmin || isManager
                  ? 'Search all tickets...'
                  : isITSupportAgent
                    ? 'Search assigned tickets...'
                    : 'Search your tickets...'
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </form>

          <div className="ml-auto flex items-center gap-3">
            <NotificationCenter />

            <button
              type="button"
              onClick={() => navigate('/profile')}
              aria-label="Open your profile"
              title={user?.fullName}
              className="rounded-full transition focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <UserAvatar user={user} />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <Suspense
            fallback={(
              <div
                role="status"
                className="flex min-h-[50vh] items-center justify-center text-blue-600"
              >
                <LoaderCircle
                  size={28}
                  className="animate-spin"
                />
                <span className="sr-only">
                  Loading page
                </span>
              </div>
            )}
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
