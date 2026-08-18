import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  AlertCircle,
  ArrowRight,
  Inbox,
  RefreshCw,
  TicketCheck,
  UsersRound,
  Wifi,
} from 'lucide-react'

import { getManagerTeam } from '../api/managerApi'
import {
  subscribeToPresence,
  subscribeToRealtimeStatus,
} from '../api/notificationHub'
import Skeleton from '../components/ui/Skeleton'

function TeamPage() {
  const [team, setTeam] = useState({
    supportAgentCount: 0,
    assignedTicketCount: 0,
    unassignedTicketCount: 0,
    agents: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [presenceUnavailable, setPresenceUnavailable] =
    useState(true)

  const loadTeam = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getManagerTeam()

      setTeam({
        supportAgentCount:
          Number(response?.supportAgentCount) || 0,
        assignedTicketCount:
          Number(response?.assignedTicketCount) || 0,
        unassignedTicketCount:
          Number(response?.unassignedTicketCount) || 0,
        agents: Array.isArray(response?.agents)
          ? response.agents
          : [],
      })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to load the support team. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTeam()
  }, [loadTeam])

  useEffect(() => {
    const unsubscribePresence = subscribeToPresence((presence) => {
      setTeam((current) => ({
        ...current,
        agents: current.agents.map((agent) =>
          agent.userId === presence.userId
            ? { ...agent, isOnline: presence.isOnline }
            : agent,
        ),
      }))
    })

    const unsubscribeStatus = subscribeToRealtimeStatus(
      (isConnected) => setPresenceUnavailable(!isConnected),
    )

    return () => {
      unsubscribePresence()
      unsubscribeStatus()
    }
  }, [])

  const onlineCount = useMemo(
    () => team.agents.filter((agent) => agent.isOnline).length,
    [team.agents],
  )

  const summaryCards = [
    {
      label: 'Support Agents',
      value: team.supportAgentCount,
      icon: UsersRound,
      iconClass: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Online Now',
      value: presenceUnavailable ? '—' : onlineCount,
      detail: presenceUnavailable ? 'Status unavailable' : undefined,
      icon: Wifi,
      iconClass: presenceUnavailable
        ? 'bg-slate-100 text-slate-500'
        : 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Assigned Tickets',
      value: team.assignedTicketCount,
      icon: TicketCheck,
      iconClass: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Unassigned',
      value: team.unassignedTicketCount,
      icon: Inbox,
      iconClass: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-blue-600">
          Manager workspace
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Team
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Monitor IT Support availability and workload.
        </p>
      </section>

      {error && (
        <section className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle size={21} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-bold text-red-800">
                Unable to load team
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadTeam}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      )}

      {loading ? (
        <div role="status" aria-label="Loading team workload" className="animate-pulse space-y-6">
          <span className="sr-only">Loading team workload</span>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-36 rounded-2xl" />
            ))}
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-3 h-4 w-80 max-w-full" />
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-56 rounded-2xl" />
              ))}
            </div>
          </section>
        </div>
      ) : !error && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map(({ label, value, detail, icon: Icon, iconClass }) => (
              <article
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
                  <Icon size={21} />
                </div>
                <p className="mt-5 text-3xl font-bold text-slate-900">{value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
                {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Support team</h2>
              <p className="mt-1 text-sm text-slate-500">
                Active IT Support Agents and their current ticket workload.
              </p>
            </div>

            {team.agents.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <UsersRound size={28} className="mx-auto text-slate-300" />
                <p className="mt-4 text-sm font-semibold text-slate-700">
                  No active IT Support Agents are available.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3 sm:p-6">
                {team.agents.map((agent) => (
                  <article key={agent.userId} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-slate-900">{agent.fullName}</h3>
                        {agent.email && (
                          <p className="mt-1 truncate text-xs text-slate-500">{agent.email}</p>
                        )}
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-slate-600">
                        <span
                          aria-hidden="true"
                          className={[
                            'h-2.5 w-2.5 rounded-full',
                            !presenceUnavailable && agent.isOnline
                              ? 'bg-emerald-500'
                              : 'bg-slate-300',
                          ].join(' ')}
                        />
                        {presenceUnavailable
                          ? 'Status unavailable'
                          : agent.isOnline
                            ? 'Online'
                            : 'Offline'}
                      </span>
                    </div>

                    <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                      <div>
                        <dd className="text-lg font-bold text-slate-900">{agent.assignedTicketCount}</dd>
                        <dt className="text-[11px] font-semibold text-slate-500">Assigned</dt>
                      </div>
                      <div>
                        <dd className="text-lg font-bold text-amber-600">{agent.inProgressTicketCount}</dd>
                        <dt className="text-[11px] font-semibold text-slate-500">In Progress</dt>
                      </div>
                      <div>
                        <dd className="text-lg font-bold text-violet-600">{agent.pendingTicketCount}</dd>
                        <dt className="text-[11px] font-semibold text-slate-500">Pending</dt>
                      </div>
                    </dl>

                    <Link
                      to={`/tickets?assignedTo=${agent.userId}`}
                      className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                      View assigned tickets
                      <ArrowRight size={16} />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="font-bold text-slate-900">Unassigned tickets</h2>
              <p className="mt-1 text-sm text-slate-500">
                {team.unassignedTicketCount === 0
                  ? 'All current tickets are assigned.'
                  : `${team.unassignedTicketCount} ticket${team.unassignedTicketCount === 1 ? '' : 's'} are waiting for assignment.`}
              </p>
            </div>
            <Link
              to="/tickets?assignment=unassigned"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View unassigned tickets
              <ArrowRight size={16} />
            </Link>
          </section>
        </>
      )}
    </div>
  )
}

export default TeamPage
