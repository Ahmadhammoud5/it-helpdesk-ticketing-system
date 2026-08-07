import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Plus,
  RefreshCw,
  TicketCheck,
} from 'lucide-react'

import { getDashboardSummary } from '../api/dashboardApi'
import { getTickets } from '../api/ticketApi'
import { useAuth } from '../auth/AuthContext'

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

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'Good morning'
  }

  if (hour < 18) {
    return 'Good afternoon'
  }

  return 'Good evening'
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7 animate-pulse">
      <div>
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-3 h-9 w-72 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-40 rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>

      <div className="h-96 rounded-2xl border border-slate-200 bg-white" />
    </div>
  )
}

function DashboardPage() {
  const { user } = useAuth()

  const [tickets, setTickets] = useState([])

  const [summary, setSummary] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const [
        summaryData,
        ticketData,
      ] = await Promise.all([
        getDashboardSummary(),
        getTickets(),
      ])

      setSummary({
        totalTickets:
          Number(summaryData?.totalTickets) || 0,
        openTickets:
          Number(summaryData?.openTickets) || 0,
        inProgressTickets:
          Number(summaryData?.inProgressTickets) || 0,
        pendingTickets:
          Number(summaryData?.pendingTickets) || 0,
        resolvedTickets:
          Number(summaryData?.resolvedTickets) || 0,
      })

      setTickets(
        Array.isArray(ticketData)
          ? ticketData
          : [],
      )
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to load dashboard information. Make sure the backend is running and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort(
        (first, second) =>
          new Date(second.lastUpdatedDate).getTime() -
          new Date(first.lastUpdatedDate).getTime(),
      )
      .slice(0, 5)
  }, [tickets])

  const summaryCards = [
    {
      label: 'Open tickets',
      value: summary.openTickets,
      description: 'Waiting for IT review',
      icon: CircleDot,
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'In progress',
      value: summary.inProgressTickets,
      description: 'Currently handled by IT',
      icon: Clock3,
      iconClass: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Pending',
      value: summary.pendingTickets,
      description: 'Temporarily waiting',
      icon: TicketCheck,
      iconClass: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Resolved',
      value: summary.resolvedTickets,
      description: 'Resolved or closed tickets',
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
  ]

  const firstName =
    user?.fullName?.trim().split(/\s+/)[0] ??
    'User'

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Employee workspace
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {firstName}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Here is what is happening with your support requests.
          </p>
        </div>

        <Link
          to="/tickets/create"
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          <Plus size={18} />
          Create ticket
        </Link>
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
                Unable to load dashboard
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      )}

      {!error && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map(
              ({
                label,
                value,
                description,
                icon: Icon,
                iconClass,
              }) => (
                <article
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {label}
                      </p>

                      <p className="mt-3 text-3xl font-bold text-slate-900">
                        {value}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
                    >
                      <Icon size={21} />
                    </div>
                  </div>

                  <p className="mt-4 text-xs font-medium text-slate-500">
                    {description}
                  </p>
                </article>
              ),
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent tickets
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your most recently updated support requests.
                </p>
              </div>

              <Link
                to="/tickets"
                className="hidden items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-700 sm:flex"
              >
                View all
                <ArrowRight size={16} />
              </Link>
            </div>

            {recentTickets.length > 0 ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[850px]">
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
                          Status
                        </th>

                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                          Last update
                        </th>

                        <th className="w-14 px-4 py-3" />
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {recentTickets.map((ticket) => (
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
                                {ticket.referenceNumber}
                              </p>

                              <p className="mt-1 max-w-sm truncate text-sm font-semibold text-slate-800 group-hover:text-blue-700">
                                {ticket.title}
                              </p>
                            </Link>
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {ticket.categoryName}
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
                                className={`text-xs font-bold ${
                                  priorityStyles[
                                    ticket.priorityName
                                  ] ?? 'text-slate-600'
                                }`}
                              >
                                {ticket.priorityName}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                                statusStyles[
                                  ticket.statusName
                                ] ??
                                'bg-slate-100 text-slate-600 ring-slate-500/10'
                              }`}
                            >
                              {ticket.statusName}
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
                              aria-label={`Open ${ticket.referenceNumber}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <ArrowRight size={17} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 md:hidden">
                  {recentTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/tickets/${ticket.id}`}
                      className="block p-5 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-blue-600">
                            {ticket.referenceNumber}
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {ticket.title}
                          </p>
                        </div>

                        <ArrowRight
                          size={17}
                          className="mt-1 shrink-0 text-slate-400"
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {ticket.categoryName}
                        </span>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                            statusStyles[
                              ticket.statusName
                            ] ??
                            'bg-slate-100 text-slate-600 ring-slate-500/10'
                          }`}
                        >
                          {ticket.statusName}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        Updated{' '}
                        {formatDate(
                          ticket.lastUpdatedDate,
                        )}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <TicketCheck size={28} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  No tickets yet
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Submit your first support request and it will appear
                  here.
                </p>

                <Link
                  to="/tickets/create"
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Create first ticket
                </Link>
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white lg:col-span-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <TicketCheck size={22} />
              </div>

              <h2 className="mt-6 text-xl font-bold">
                Need help with a technical issue?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                Submit a detailed ticket and the IT team will receive it
                immediately.
              </p>

              <Link
                to="/tickets/create"
                className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-blue-950 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900"
              >
                Create a new ticket
                <ArrowRight size={16} />
              </Link>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
              <p className="text-sm font-bold text-slate-900">
                Support availability
              </p>

              <p className="mt-4 text-2xl font-bold text-emerald-600">
                Online
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                IT support is currently available and responding to
                requests.
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Support team available
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  )
}

export default DashboardPage