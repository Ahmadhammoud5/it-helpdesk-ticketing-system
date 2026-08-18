import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  RefreshCw,
  TicketCheck,
  XCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getReportSummary } from '../api/reportApi'

const statusColors = {
  Open: '#2563eb',
  'In Progress': '#f59e0b',
  Pending: '#8b5cf6',
  Resolved: '#10b981',
  Closed: '#64748b',
  Cancelled: '#ef4444',
}

const priorityColors = {
  Low: '#64748b',
  Medium: '#2563eb',
  High: '#f59e0b',
  Critical: '#ef4444',
}

const fallbackColors = [
  '#2563eb',
  '#4f46e5',
  '#8b5cf6',
  '#0ea5e9',
  '#14b8a6',
  '#64748b',
]

function toDateInput(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function getThisMonthPeriod() {
  const today = new Date()
  const from = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    1,
  ))

  return {
    from: toDateInput(from),
    to: toDateInput(today),
  }
}

function getLastThirtyDaysPeriod() {
  const today = new Date()
  const from = new Date(today)
  from.setUTCDate(from.getUTCDate() - 29)

  return {
    from: toDateInput(from),
    to: toDateInput(today),
  }
}

function parseDate(dateValue) {
  return new Date(`${dateValue}T00:00:00Z`)
}

function formatPeriodDate(dateValue, options = {}) {
  if (!dateValue) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(parseDate(dateValue))
}

function formatChartDate(dateValue) {
  return formatPeriodDate(dateValue, {
    day: '2-digit',
    month: 'short',
    year: undefined,
  })
}

function formatResolutionTime(minutes) {
  if (minutes === null || minutes === undefined) {
    return '—'
  }

  const totalMinutes = Math.max(0, Math.round(Number(minutes)))

  if (!Number.isFinite(totalMinutes)) {
    return '—'
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (totalHours < 24) {
    return remainingMinutes > 0
      ? `${totalHours} hr ${remainingMinutes} min`
      : `${totalHours} hr`
  }

  const days = Math.floor(totalHours / 24)
  const remainingHours = totalHours % 24

  return remainingHours > 0
    ? `${days} day${days === 1 ? '' : 's'} ${remainingHours} hr`
    : `${days} day${days === 1 ? '' : 's'}`
}

function ReportsSkeleton() {
  return (
    <div className="animate-pulse space-y-7">
      <div>
        <div className="h-9 w-72 max-w-full rounded bg-slate-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />
      </div>

      <div className="h-32 rounded-2xl border border-slate-200 bg-white" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div
            key={item}
            className="h-32 rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-96 rounded-2xl border border-slate-200 bg-white" />
        <div className="h-96 rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  )
}

function EmptyChart({ message = 'No ticket data available.' }) {
  return (
    <div className="flex h-72 items-center justify-center px-4 text-center text-sm font-medium text-slate-400">
      {message}
    </div>
  )
}

function ChartCard({ title, description, children }) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
      <h3 className="font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>

      {children}
    </article>
  )
}

function ReportsPage() {
  const initialPeriod = useMemo(
    () => getThisMonthPeriod(),
    [],
  )

  const [draftPeriod, setDraftPeriod] = useState(initialPeriod)
  const [appliedPeriod, setAppliedPeriod] = useState(initialPeriod)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getReportSummary(appliedPeriod)
      setReport(data)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to load report data. Make sure the backend is running and try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [appliedPeriod])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  function applyPeriod(event) {
    event.preventDefault()

    if (!draftPeriod.from || !draftPeriod.to) {
      setValidationError('Choose both a From date and a To date.')
      return
    }

    if (draftPeriod.from > draftPeriod.to) {
      setValidationError('The From date must be on or before the To date.')
      return
    }

    setValidationError('')
    setAppliedPeriod({ ...draftPeriod })
  }

  function applyQuickPeriod(period) {
    setValidationError('')
    setDraftPeriod(period)
    setAppliedPeriod(period)
  }

  const normalizedReport = {
    totalTickets: Number(report?.totalTickets) || 0,
    openTickets: Number(report?.openTickets) || 0,
    inProgressTickets: Number(report?.inProgressTickets) || 0,
    pendingTickets: Number(report?.pendingTickets) || 0,
    resolvedTickets: Number(report?.resolvedTickets) || 0,
    closedTickets: Number(report?.closedTickets) || 0,
    cancelledTickets: Number(report?.cancelledTickets) || 0,
    averageResolutionMinutes:
      report?.averageResolutionMinutes ?? null,
    ticketsByStatus: report?.ticketsByStatus ?? [],
    ticketsByPriority: report?.ticketsByPriority ?? [],
    ticketsByCategory: report?.ticketsByCategory ?? [],
    ticketVolume: report?.ticketVolume ?? [],
  }

  const summaryCards = [
    {
      label: 'Total Tickets',
      value: normalizedReport.totalTickets,
      icon: TicketCheck,
      iconClass: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Open',
      value: normalizedReport.openTickets,
      icon: CircleDot,
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'In Progress',
      value: normalizedReport.inProgressTickets,
      icon: Activity,
      iconClass: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Pending',
      value: normalizedReport.pendingTickets,
      icon: Clock3,
      iconClass: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Resolved',
      value: normalizedReport.resolvedTickets,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Closed',
      value: normalizedReport.closedTickets,
      icon: CheckCircle2,
      iconClass: 'bg-slate-100 text-slate-600',
    },
    {
      label: 'Cancelled',
      value: normalizedReport.cancelledTickets,
      icon: XCircle,
      iconClass: 'bg-red-50 text-red-600',
    },
    {
      label: 'Avg. Resolution',
      value: formatResolutionTime(
        normalizedReport.averageResolutionMinutes,
      ),
      icon: Clock3,
      iconClass: 'bg-cyan-50 text-cyan-600',
    },
  ]

  const hasVolume = normalizedReport.ticketVolume.some(
    (item) => Number(item.count) > 0,
  )

  if (loading && !report) {
    return <ReportsSkeleton />
  }

  return (
    <div className="space-y-7">
      <section>
        <p className="text-sm font-semibold text-blue-600">
          Operational insights
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Reports &amp; Analytics
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Analyze HelpDesk ticket activity and resolution performance.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-blue-600" />
          <h2 className="font-bold text-slate-900">
            Reporting period
          </h2>
        </div>

        <form
          onSubmit={applyPeriod}
          className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end"
        >
          <label className="block flex-1 text-sm font-semibold text-slate-700">
            From date
            <input
              type="date"
              value={draftPeriod.from}
              onChange={(event) => {
                setDraftPeriod((current) => ({
                  ...current,
                  from: event.target.value,
                }))
                setValidationError('')
              }}
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block flex-1 text-sm font-semibold text-slate-700">
            To date
            <input
              type="date"
              value={draftPeriod.to}
              onChange={(event) => {
                setDraftPeriod((current) => ({
                  ...current,
                  to: event.target.value,
                }))
                setValidationError('')
              }}
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row xl:shrink-0">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <RefreshCw size={16} className="animate-spin" />
              )}
              Apply
            </button>

            <button
              type="button"
              onClick={() => applyQuickPeriod(getThisMonthPeriod())}
              disabled={loading}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              This Month
            </button>

            <button
              type="button"
              onClick={() => applyQuickPeriod(getLastThirtyDaysPeriod())}
              disabled={loading}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Last 30 Days
            </button>
          </div>
        </form>

        {validationError && (
          <p className="mt-3 text-sm font-medium text-red-600" role="alert">
            {validationError}
          </p>
        )}

        <p className="mt-4 text-sm text-slate-500">
          Showing tickets created from{' '}
          <span className="font-semibold text-slate-700">
            {formatPeriodDate(report?.from ?? appliedPeriod.from)}
          </span>{' '}
          through{' '}
          <span className="font-semibold text-slate-700">
            {formatPeriodDate(report?.to ?? appliedPeriod.to)}
          </span>
          .
        </p>
      </section>

      {error && (
        <section
          role="alert"
          className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={20} />
            <div>
              <p className="font-bold text-red-900">
                Report data could not be loaded
              </p>
              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadReport}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      )}

      {report && (
        <>
          {normalizedReport.totalTickets === 0 && (
            <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-800">
              No ticket activity was found for this reporting period.
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map(({ label, value, icon: Icon, iconClass }) => (
              <article
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      {label}
                    </p>
                    <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                      {value}
                    </p>
                  </div>

                  <span className={`rounded-xl p-3 ${iconClass}`}>
                    <Icon size={20} />
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Ticket Volume Over Time"
              description="Daily ticket creation volume in the selected period."
            >
              {hasVolume ? (
                <div className="mt-5 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={normalizedReport.ticketVolume}
                      margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        minTickGap={28}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        labelFormatter={(label) => formatPeriodDate(label)}
                        formatter={(value) => [value, 'Tickets']}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Tickets"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No daily ticket activity in this period." />
              )}
            </ChartCard>

            <ChartCard
              title="Tickets by Status"
              description="Workflow distribution for tickets created in this period."
            >
              {normalizedReport.ticketsByStatus.length > 0 ? (
                <div className="mt-5 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={normalizedReport.ticketsByStatus}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="name"
                        interval={0}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
                        {normalizedReport.ticketsByStatus.map((item, index) => (
                          <Cell
                            key={item.name}
                            fill={statusColors[item.name] ?? fallbackColors[index % fallbackColors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard
              title="Tickets by Priority"
              description="Request distribution across configured priority levels."
            >
              {normalizedReport.ticketsByPriority.length > 0 ? (
                <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center">
                  <div className="h-64 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={normalizedReport.ticketsByPriority}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={88}
                          paddingAngle={3}
                        >
                          {normalizedReport.ticketsByPriority.map((item, index) => (
                            <Cell
                              key={item.name}
                              fill={priorityColors[item.name] ?? fallbackColors[index % fallbackColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <ul className="space-y-3">
                    {normalizedReport.ticketsByPriority.map((item, index) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-slate-600">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                priorityColors[item.name] ??
                                fallbackColors[index % fallbackColors.length],
                            }}
                          />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="font-bold text-slate-900">
                          {item.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard
              title="Tickets by Category"
              description="Categories generating support requests in this period."
            >
              {normalizedReport.ticketsByCategory.length > 0 ? (
                <div
                  className="mt-5 w-full"
                  style={{
                    height: Math.max(
                      288,
                      normalizedReport.ticketsByCategory.length * 42,
                    ),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={normalizedReport.ticketsByCategory}
                      layout="vertical"
                      margin={{ top: 5, right: 16, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={105}
                        tickFormatter={(value) =>
                          value.length > 16
                            ? `${value.slice(0, 15)}…`
                            : value
                        }
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar
                        dataKey="count"
                        name="Tickets"
                        fill="#4f46e5"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </section>
        </>
      )}
    </div>
  )
}

export default ReportsPage
