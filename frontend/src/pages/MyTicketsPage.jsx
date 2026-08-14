import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useSearchParams,
} from 'react-router'
import {
  AlertCircle,
  ArrowRight,
  Filter,
  Plus,
  RefreshCw,
  Search,
  TicketCheck,
} from 'lucide-react'

import {
  getSupportAgents,
  getTickets,
} from '../api/ticketApi'
import { useAuth } from '../auth/useAuth'
import {
  getRoleContext,
  ROLES,
} from '../auth/roles'
import {
  getCategories,
  getStatuses,
} from '../api/lookupApi'

const statusStyles = {
  Open: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  'In Progress':
    'bg-amber-50 text-amber-700 ring-amber-600/10',
  Pending:
    'bg-violet-50 text-violet-700 ring-violet-600/10',
  Resolved:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  Closed:
    'bg-slate-100 text-slate-600 ring-slate-500/10',
  Cancelled:
    'bg-red-50 text-red-700 ring-red-600/10',
}

const priorityStyles = {
  Low: 'text-slate-500',
  Medium: 'text-blue-600',
  High: 'text-amber-600',
  Critical: 'text-red-600',
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '—'
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function LoadingRows() {
  return (
    <div className="divide-y divide-slate-100">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse p-5 lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] lg:items-center lg:gap-5"
        >
          <div>
            <div className="h-3 w-40 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-64 max-w-full rounded bg-slate-200" />
          </div>

          <div className="mt-4 h-7 w-24 rounded-lg bg-slate-200 lg:mt-0" />
          <div className="mt-3 h-4 w-16 rounded bg-slate-200 lg:mt-0" />
          <div className="mt-3 h-7 w-24 rounded-full bg-slate-200 lg:mt-0" />
          <div className="mt-3 h-4 w-28 rounded bg-slate-200 lg:mt-0" />
        </div>
      ))}
    </div>
  )
}

function MyTicketsPage() {
  const { user } = useAuth()
  const roleContext = getRoleContext(user)
  const [searchParams, setSearchParams] =
    useSearchParams()
  const searchQuery =
    searchParams.get('search') ?? ''
  const assignedToQuery =
    searchParams.get('assignedTo') ?? ''
  const assignmentQuery =
    searchParams.get('assignment') ?? ''
  const hasAssignmentFilter =
    Boolean(assignedToQuery) ||
    assignmentQuery.toLowerCase() === 'unassigned'
  const canResolveAgents =
    roleContext.role === ROLES.admin ||
    roleContext.role === ROLES.manager

  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState([])
  const [statuses, setStatuses] = useState([])
  const [assignedAgentName, setAssignedAgentName] =
    useState('')

  const [activeStatus, setActiveStatus] =
    useState('All')

  const [categoryFilter, setCategoryFilter] =
    useState('all')

  const [searchTerm, setSearchTerm] =
    useState(searchQuery)
  const [sortOrder, setSortOrder] =
    useState('newest')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPageData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [
        ticketData,
        categoryData,
        statusData,
        supportAgentData,
      ] = await Promise.all([
        getTickets({
          assignedTo: assignedToQuery || undefined,
          assignment: assignmentQuery || undefined,
        }),
        getCategories(),
        getStatuses(),
        assignedToQuery && canResolveAgents
          ? getSupportAgents().catch(() => [])
          : Promise.resolve([]),
      ])

      setTickets(
        Array.isArray(ticketData)
          ? ticketData
          : [],
      )

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : [],
      )

      setStatuses(
        Array.isArray(statusData)
          ? statusData
          : [],
      )

      const assignedAgent = Array.isArray(supportAgentData)
        ? supportAgentData.find(
            (agent) =>
              String(agent.userId) === assignedToQuery,
          )
        : null

      setAssignedAgentName(assignedAgent?.fullName ?? '')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to load tickets. Make sure the backend is running and try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [assignedToQuery, assignmentQuery, canResolveAgents])

  useEffect(() => {
    loadPageData()
  }, [loadPageData])

  useEffect(() => {
    setSearchTerm(searchQuery)
  }, [searchQuery])

  function updateTicketSearch(value) {
    setSearchTerm(value)

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        const cleanValue = value.trim()

        if (cleanValue) {
          next.set('search', value)
        } else {
          next.delete('search')
        }

        return next
      },
      { replace: true },
    )
  }

  const filteredTickets = useMemo(() => {
    const searchValue =
      searchTerm.trim().toLowerCase()

    const result = tickets.filter((ticket) => {
      const matchesStatus =
        activeStatus === 'All' ||
        ticket.statusName === activeStatus

      const matchesCategory =
        categoryFilter === 'all' ||
        String(ticket.categoryId) ===
          categoryFilter

      const matchesSearch =
        searchValue.length === 0 ||
        ticket.title
          ?.toLowerCase()
          .includes(searchValue) ||
        ticket.referenceNumber
          ?.toLowerCase()
          .includes(searchValue) ||
        ticket.categoryName
          ?.toLowerCase()
          .includes(searchValue)

      return (
        matchesStatus &&
        matchesCategory &&
        matchesSearch
      )
    })

    return [...result].sort((first, second) => {
      const firstDate = new Date(
        first.lastUpdatedDate,
      ).getTime()

      const secondDate = new Date(
        second.lastUpdatedDate,
      ).getTime()

      return sortOrder === 'newest'
        ? secondDate - firstDate
        : firstDate - secondDate
    })
  }, [
    tickets,
    activeStatus,
    categoryFilter,
    searchTerm,
    sortOrder,
  ])

  function getStatusCount(statusName) {
    if (statusName === 'All') {
      return tickets.length
    }

    return tickets.filter(
      (ticket) =>
        ticket.statusName === statusName,
    ).length
  }

  function clearFilters() {
    setActiveStatus('All')
    setCategoryFilter('all')
    setSortOrder('newest')

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('search')
        next.delete('assignedTo')
        next.delete('assignment')
        return next
      },
      { replace: true },
    )
  }

  function clearAssignmentFilter() {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('assignedTo')
        next.delete('assignment')
        return next
      },
      { replace: true },
    )
  }

  const tabs = [
    {
      id: 'all',
      statusName: 'All',
      sortOrder: 0,
    },
    ...statuses,
  ]

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Ticket management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {roleContext.ticketsTitle}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {roleContext.ticketsDescription}
          </p>
        </div>

        {roleContext.canCreateTickets && (
          <Link
            to="/tickets/create"
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            <Plus size={18} />
            Create ticket
          </Link>
        )}
      </section>

      {error && (
        <section className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-bold text-red-800">
                Unable to load tickets
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadPageData}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      )}

      {hasAssignmentFilter && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
          <p className="font-semibold text-blue-800">
            {assignedToQuery
              ? `Assigned to: ${assignedAgentName || `Agent #${assignedToQuery}`}`
              : 'Assignment: Unassigned active tickets'}
          </p>
          <button
            type="button"
            onClick={clearAssignmentFilter}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Clear assignment filter
          </button>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const statusName =
                tab.statusName

              return (
                <button
                  key={tab.id ?? statusName}
                  type="button"
                  aria-pressed={
                    activeStatus === statusName
                  }
                  onClick={() =>
                    setActiveStatus(statusName)
                  }
                  className={[
                    'flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition',
                    activeStatus === statusName
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  ].join(' ')}
                >
                  {statusName}

                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-[11px] font-bold',
                      activeStatus === statusName
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-slate-500',
                    ].join(' ')}
                  >
                    {getStatusCount(
                      statusName,
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(260px,1fr)_220px_180px]">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                updateTicketSearch(
                  event.target.value,
                )
              }
              aria-label="Search tickets by title, reference or category"
              placeholder="Search by title or reference..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="relative">
            <Filter
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              aria-label="Filter tickets by category"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value,
                )
              }
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">
                All categories
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <select
            aria-label="Sort tickets"
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(
                event.target.value,
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="newest">
              Newest first
            </option>

            <option value="oldest">
              Oldest first
            </option>
          </select>
        </div>

        {loading ? (
          <LoadingRows />
        ) : filteredTickets.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-left">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Ticket
                    </th>

                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Category
                    </th>

                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Priority
                    </th>

                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {roleContext.role === ROLES.employee
                        ? 'Assigned agent'
                        : 'Requester'}
                    </th>

                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Updated
                    </th>

                    <th className="w-16 px-4 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map(
                    (ticket) => (
                      <tr
                        key={ticket.id}
                        className="group transition hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <Link
                            to={`/tickets/${ticket.id}`}
                            className="block"
                          >
                            <p className="text-xs font-bold text-blue-600">
                              {
                                ticket.referenceNumber
                              }
                            </p>

                            <p className="mt-1 max-w-sm truncate text-sm font-semibold text-slate-800 group-hover:text-blue-700">
                              {ticket.title}
                            </p>
                          </Link>
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {
                              ticket.categoryName
                            }
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor:
                                  ticket.priorityColorCode ??
                                  '#64748b',
                              }}
                            />

                            <span
                              className={[
                                'text-xs font-bold',
                                priorityStyles[
                                  ticket
                                    .priorityName
                                ] ??
                                  'text-slate-600',
                              ].join(' ')}
                            >
                              {
                                ticket.priorityName
                              }
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-slate-600">
                          {roleContext.role === ROLES.employee
                            ? ticket.assignedToName ?? 'Unassigned'
                            : ticket.createdByName ?? 'Unknown'}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
                              statusStyles[
                                ticket.statusName
                              ] ??
                                'bg-slate-100 text-slate-600 ring-slate-500/10',
                            ].join(' ')}
                          >
                            {
                              ticket.statusName
                            }
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-500">
                          {formatDate(
                            ticket.lastUpdatedDate,
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <Link
                            to={`/tickets/${ticket.id}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            aria-label={`Open ${ticket.referenceNumber}`}
                          >
                            <ArrowRight
                              size={17}
                            />
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {filteredTickets.map(
                (ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/tickets/${ticket.id}`}
                    className="block p-5 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-blue-600">
                          {
                            ticket.referenceNumber
                          }
                        </p>

                        <h2 className="mt-1 text-sm font-bold leading-5 text-slate-800">
                          {ticket.title}
                        </h2>
                      </div>

                      <ArrowRight
                        size={18}
                        className="mt-1 shrink-0 text-slate-400"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {ticket.categoryName}
                      </span>

                      <span
                        className={[
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
                          statusStyles[
                            ticket.statusName
                          ] ??
                            'bg-slate-100 text-slate-600 ring-slate-500/10',
                        ].join(' ')}
                      >
                        {ticket.statusName}
                      </span>

                      <span
                        className={[
                          'rounded-lg bg-white px-2.5 py-1 text-xs font-bold ring-1 ring-slate-200',
                          priorityStyles[
                            ticket
                              .priorityName
                          ] ??
                            'text-slate-600',
                        ].join(' ')}
                      >
                        {ticket.priorityName}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4 text-xs text-slate-500">
                      <span className="truncate">
                        {roleContext.role === ROLES.employee
                          ? `Agent: ${ticket.assignedToName ?? 'Unassigned'}`
                          : `Requester: ${ticket.createdByName ?? 'Unknown'}`}
                      </span>

                      <span className="shrink-0">
                        {formatDate(
                          ticket.lastUpdatedDate,
                        )}
                      </span>
                    </div>
                  </Link>
                ),
              )}
            </div>

            <div className="border-t border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {filteredTickets.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                  {tickets.length}
                </span>{' '}
                tickets
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <TicketCheck size={28} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              {tickets.length === 0 && !hasAssignmentFilter
                ? roleContext.emptyTitle
                : 'No tickets found'}
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {tickets.length === 0 && !hasAssignmentFilter
                ? roleContext.emptyDescription
                : 'Try changing the selected filters or searching with another title or reference number.'}
            </p>

            {tickets.length === 0 && !hasAssignmentFilter ? (
              roleContext.canCreateTickets ? (
                <Link
                  to="/tickets/create"
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Create first ticket
                </Link>
              ) : null
            ) : (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default MyTicketsPage
