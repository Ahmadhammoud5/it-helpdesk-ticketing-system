import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Power,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
} from 'lucide-react'

import {
  createUser,
  getUsers,
  updateUserRole,
  updateUserStatus,
} from '../api/adminApi'
import {
  subscribeToPresence,
  subscribeToRealtimeStatus,
} from '../api/notificationHub'
import { ROLES } from '../auth/roles'
import { useAuth } from '../auth/useAuth'
import { formatPresence } from '../utils/presence'

const availableRoles = [
  ROLES.admin,
  ROLES.manager,
  ROLES.supportAgent,
  ROLES.employee,
]

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: ROLES.employee,
}

function getErrorMessage(error, fallback) {
  const response = error.response?.data

  if (Array.isArray(response?.errors)) {
    const messages = response.errors
      .map((item) =>
        typeof item === 'string'
          ? item
          : item?.description,
      )
      .filter(Boolean)

    if (messages.length > 0) {
      return messages.join(' ')
    }
  }

  if (
    response?.errors &&
    typeof response.errors === 'object'
  ) {
    const messages = Object.values(
      response.errors,
    )
      .flat()
      .filter(
        (item) => typeof item === 'string',
      )

    if (messages.length > 0) {
      return messages.join(' ')
    }
  }

  return response?.message ?? fallback
}

function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(initialForm)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updatingUserId, setUpdatingUserId] =
    useState(null)
  const [updatingStatusUserId, setUpdatingStatusUserId] =
    useState(null)
  const [presenceUnavailable, setPresenceUnavailable] =
    useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadUsers() {
    setLoading(true)
    setError('')

    try {
      const data = await getUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Unable to load users. Please try again.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const unsubscribePresence = subscribeToPresence((presence) => {
      setUsers((current) =>
        current.map((item) =>
          item.userId === presence.userId
            ? {
                ...item,
                isOnline:
                  item.isActive && presence.isOnline,
                lastSeenUtc:
                  presence.lastSeenUtc ??
                  item.lastSeenUtc,
              }
            : item,
        ),
      )
    })

    const unsubscribeStatus = subscribeToRealtimeStatus(
      (isConnected) => setPresenceUnavailable(!isConnected),
    )

    return () => {
      unsubscribePresence()
      unsubscribeStatus()
    }
  }, [])

  const filteredUsers = useMemo(() => {
    const value = searchTerm.trim().toLowerCase()

    if (!value) {
      return users
    }

    return users.filter((user) =>
      [
        user.fullName,
        user.email,
        ...(user.roles ?? []),
      ].some((field) =>
        field?.toLowerCase().includes(value),
      ),
    )
  }, [searchTerm, users])

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
    setFormError('')
    setSuccess('')
  }

  async function handleCreateUser(event) {
    event.preventDefault()
    setCreating(true)
    setFormError('')
    setSuccess('')

    try {
      await createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      })

      setForm(initialForm)
      setSuccess('User created successfully.')
      await loadUsers()
    } catch (requestError) {
      setFormError(
        getErrorMessage(
          requestError,
          'Unable to create the user.',
        ),
      )
    } finally {
      setCreating(false)
    }
  }

  async function handleRoleChange(user, role) {
    setUpdatingUserId(user.userId)
    setError('')
    setSuccess('')

    try {
      await updateUserRole(user.userId, role)
      setUsers((current) =>
        current.map((item) =>
          item.userId === user.userId
            ? { ...item, roles: [role] }
            : item,
        ),
      )
      setSuccess(`Role updated for ${user.fullName}.`)
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Unable to update the user role.',
        ),
      )
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function handleStatusChange(user) {
    const nextIsActive = !user.isActive
    const action = nextIsActive ? 'reactivate' : 'deactivate'

    if (
      !nextIsActive &&
      !window.confirm(
        `Deactivate ${user.fullName}? They will be signed out and unable to use the system.`,
      )
    ) {
      return
    }

    setUpdatingStatusUserId(user.userId)
    setError('')
    setSuccess('')

    try {
      const result = await updateUserStatus(
        user.userId,
        nextIsActive,
      )

      setUsers((current) =>
        current.map((item) =>
          item.userId === user.userId
            ? {
                ...item,
                isActive: result.isActive,
                isOnline: false,
                lastSeenUtc:
                  result.lastSeenUtc ?? item.lastSeenUtc,
              }
            : item,
        ),
      )

      setSuccess(
        `${user.fullName} was ${action}d successfully.`,
      )
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          `Unable to ${action} the user.`,
        ),
      )
    } finally {
      setUpdatingStatusUserId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-blue-600">
          Administration
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          User management
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Create accounts and maintain roles and account access.
        </p>
      </section>

      {error && (
        <section aria-live="polite" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </section>
      )}

      {success && (
        <section aria-live="polite" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form
          onSubmit={handleCreateUser}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Plus size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Create user
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add a user with one of the four system roles.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="text-sm font-semibold text-slate-700">
                First name
                <input
                  required
                  maxLength={50}
                  value={form.firstName}
                  onChange={(event) =>
                    updateForm('firstName', event.target.value)
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Last name
                <input
                  required
                  maxLength={50}
                  value={form.lastName}
                  onChange={(event) =>
                    updateForm('lastName', event.target.value)
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Email
              <input
                required
                type="email"
                maxLength={254}
                value={form.email}
                onChange={(event) =>
                  updateForm('email', event.target.value)
                }
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Temporary password
              <input
                required
                type="password"
                minLength={8}
                maxLength={128}
                value={form.password}
                onChange={(event) =>
                  updateForm('password', event.target.value)
                }
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
              <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">
                Use at least 8 characters with uppercase, lowercase,
                number and symbol.
              </span>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Role
              <select
                value={form.role}
                onChange={(event) =>
                  updateForm('role', event.target.value)
                }
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {formError && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={creating}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {creating ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Plus size={17} />
            )}
            {creating ? 'Creating user...' : 'Create user'}
          </button>
        </form>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Users
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {users.length} account{users.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative min-w-0 sm:w-72">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search users..."
                  aria-label="Search users by name, email or role"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="button"
                onClick={loadUsers}
                disabled={loading}
                aria-label="Refresh users"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loading ? 'animate-spin' : ''}
                />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <LoaderCircle
                size={28}
                className="animate-spin text-blue-600"
              />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UsersRound size={25} />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">
                No users found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another search or create a user.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      User
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Account
                    </th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Presence
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Role
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const role = user.roles?.[0] ?? ''
                    const updating = updatingUserId === user.userId

                    return (
                      <tr key={user.userId} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <p title={user.fullName} className="max-w-xs truncate text-sm font-bold text-slate-900">
                            {user.fullName}
                          </p>
                          <p title={user.email} className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {user.email}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
                              user.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500',
                            ].join(' ')}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span
                              aria-hidden="true"
                              className={[
                                'h-2.5 w-2.5 rounded-full',
                                user.isActive && user.isOnline
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-300',
                              ].join(' ')}
                            />
                            {user.isActive
                              ? presenceUnavailable
                                ? 'Status unavailable'
                                : formatPresence(user)
                              : 'Offline'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={role}
                              disabled={
                                updatingUserId !== null ||
                                updatingStatusUserId !== null
                              }
                              onChange={(event) =>
                                handleRoleChange(user, event.target.value)
                              }
                              aria-label={`Role for ${user.fullName}`}
                              className="h-10 min-w-48 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                            >
                              <option value="" disabled>
                                Select role
                              </option>
                              {availableRoles.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            {updating && (
                              <LoaderCircle
                                size={17}
                                className="animate-spin text-blue-600"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(user)}
                            disabled={
                              updatingStatusUserId !== null ||
                              updatingUserId !== null ||
                              Number(currentUser?.userId) === user.userId
                            }
                            aria-label={`${user.isActive ? 'Deactivate' : 'Reactivate'} user ${user.fullName}`}
                            title={
                              Number(currentUser?.userId) === user.userId
                                ? 'You cannot deactivate your own account.'
                                : undefined
                            }
                            className={[
                              'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                              user.isActive
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
                            ].join(' ')}
                          >
                            {updatingStatusUserId === user.userId ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                              <Power size={16} />
                            )}
                            {user.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  )
}

export default UsersPage
