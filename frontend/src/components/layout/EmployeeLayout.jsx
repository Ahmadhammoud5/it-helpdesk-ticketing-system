import { useState } from 'react'
import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router'
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  TicketCheck,
  X,
} from 'lucide-react'

import { useAuth } from '../../auth/AuthContext'

const navigation = [
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

function getInitials(fullName) {
  if (!fullName) {
    return 'U'
  }

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function SidebarContent({
  closeSidebar,
  user,
  onLogout,
}) {
  const initials = getInitials(user?.fullName)
  const primaryRole = user?.roles?.[0] ?? 'Employee'

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
              IDS · Employee portal
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
                key={to}
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
                <span>{label}</span>
              </NavLink>
            ),
          )}

          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-400"
          >
            <Bell size={18} />
            <span>Notifications</span>

            <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Soon
            </span>
          </button>
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">
                {user?.fullName ?? 'User'}
              </p>

              <p className="truncate text-xs text-slate-500">
                {primaryRole}
              </p>
            </div>

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

function EmployeeLayout() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const [sidebarOpen, setSidebarOpen] =
    useState(false)

  const initials = getInitials(user?.fullName)

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
          onClick={() => setSidebarOpen(false)}
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
          closeSidebar={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-30 flex h-20 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="mr-3 rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div className="relative hidden w-full max-w-md sm:block">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              placeholder="Search your tickets..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              disabled
              className="relative flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400"
              aria-label="Notifications coming soon"
            >
              <Bell size={18} />
            </button>

            <div
              title={user?.fullName}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm"
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default EmployeeLayout