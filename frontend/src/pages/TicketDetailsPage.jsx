import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  Hash,
  Info,
  LoaderCircle,
  RefreshCw,
  Tag,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'

import {
  deleteTicket,
  getTicketById,
} from '../api/ticketApi'

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

const statusOrder = [
  'Open',
  'In Progress',
  'Pending',
  'Resolved',
  'Closed',
]

const statusDescriptions = {
  Open: 'The ticket was submitted and is waiting for review.',
  'In Progress':
    'An IT support agent is currently investigating the issue.',
  Pending:
    'The ticket is temporarily waiting for more information or action.',
  Resolved:
    'The reported technical issue has been resolved.',
  Closed:
    'The support request has been completed and closed.',
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
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function DetailRow({
  icon: Icon,
  label,
  children,
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 py-4 last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <div className="mt-1 text-sm font-semibold text-slate-700">
          {children}
        </div>
      </div>
    </div>
  )
}

function TicketDetailsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-5 w-40 rounded bg-slate-200" />

      <div>
        <div className="h-7 w-52 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-full max-w-3xl rounded bg-slate-200" />
        <div className="mt-3 h-4 w-56 rounded bg-slate-200" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="h-96 rounded-2xl border border-slate-200 bg-white" />
        <div className="h-96 rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  )
}

function TicketDetailsPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false)

  const [deleting, setDeleting] =
    useState(false)

  const [deleteError, setDeleteError] =
    useState('')

  const ticketCreated =
    location.state?.ticketCreated === true

  async function loadTicket() {
    setLoading(true)
    setError('')
    setNotFound(false)

    try {
      const data = await getTicketById(ticketId)
      setTicket(data)
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setNotFound(true)
      } else {
        setError(
          requestError.response?.data?.message ??
            'Unable to load this ticket. Make sure the backend is running and try again.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTicket()
  }, [ticketId])

  useEffect(() => {
    if (!ticketCreated) {
      return
    }

    navigate(location.pathname, {
      replace: true,
      state: {},
    })
  }, [])

  const timeline = useMemo(() => {
    if (!ticket) {
      return []
    }

    const currentIndex = statusOrder.indexOf(
      ticket.statusName,
    )

    return statusOrder.map(
      (statusName, index) => ({
        statusName,
        description:
          statusDescriptions[statusName],
        completed:
          currentIndex >= 0 &&
          index <= currentIndex,
        current:
          ticket.statusName === statusName,
      }),
    )
  }, [ticket])

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')

    try {
      await deleteTicket(ticket.id)

      navigate('/tickets', {
        replace: true,
        state: {
          ticketDeleted: true,
        },
      })
    } catch (requestError) {
      setDeleteError(
        requestError.response?.data?.message ??
          'Unable to delete this ticket. Please try again.',
      )
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <TicketDetailsSkeleton />
  }

  if (notFound) {
    return (
      <section className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle size={28} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Ticket not found
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          This ticket does not exist, was deleted, or you do not have
          permission to access it.
        </p>

        <Link
          to="/tickets"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <ArrowLeft size={17} />
          Return to my tickets
        </Link>
      </section>
    )
  }

  if (error || !ticket) {
    return (
      <section className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-red-600">
          <AlertTriangle size={28} />
        </div>

        <h1 className="mt-5 text-xl font-bold text-red-900">
          Unable to load ticket
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-red-700">
          {error}
        </p>

        <button
          type="button"
          onClick={loadTicket}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <RefreshCw size={17} />
          Try again
        </button>
      </section>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {ticketCreated && (
          <section className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2
              size={21}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <div>
              <p className="text-sm font-bold text-emerald-800">
                Ticket created successfully
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                Your support request was saved and sent to the IT team.
              </p>
            </div>
          </section>
        )}

        <section>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to my tickets
          </Link>

          <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    'inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset',
                    statusStyles[ticket.statusName] ??
                      'bg-slate-100 text-slate-600 ring-slate-500/10',
                  ].join(' ')}
                >
                  {ticket.statusName}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        ticket.priorityColorCode ??
                        '#64748b',
                    }}
                  />

                  {ticket.priorityName} priority
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {ticket.categoryName}
                </span>
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight text-slate-900">
                {ticket.title}
              </h1>

              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                <Hash size={15} />
                {ticket.referenceNumber}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/tickets/${ticket.id}/edit`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <Edit3 size={17} />
                Edit ticket
              </Link>

              <button
                type="button"
                onClick={() => {
                  setDeleteError('')
                  setDeleteModalOpen(true)
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={17} />
                Delete
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Description
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Information submitted with this support request.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {ticket.description}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Communication
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Replies and support-agent comments will appear here.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Info size={25} />
                </div>

                <h3 className="mt-4 font-bold text-slate-900">
                  Conversation coming in Week 4
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Comments and replies will be enabled when the ticket
                  communication API is implemented.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <Info
                  size={20}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <div>
                  <h2 className="text-sm font-bold text-blue-900">
                    Status updates are managed by IT
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-blue-700">
                    Assignment and workflow status changes will become
                    available to authorised IT staff during Week 4.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <h2 className="text-lg font-bold text-slate-900">
                Ticket details
              </h2>

              <div className="mt-3">
                <DetailRow
                  icon={Tag}
                  label="Category"
                >
                  {ticket.categoryName}
                </DetailRow>

                <DetailRow
                  icon={AlertTriangle}
                  label="Priority"
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          ticket.priorityColorCode ??
                          '#64748b',
                      }}
                    />

                    {ticket.priorityName}
                  </span>
                </DetailRow>

                <DetailRow
                  icon={UserRound}
                  label="Created by"
                >
                  {ticket.createdByName}
                </DetailRow>

                <DetailRow
                  icon={UserRound}
                  label="Assigned agent"
                >
                  {ticket.assignedToName ??
                    'Unassigned'}
                </DetailRow>

                <DetailRow
                  icon={CalendarDays}
                  label="Created"
                >
                  {formatDate(ticket.createdDate)}
                </DetailRow>

                <DetailRow
                  icon={Clock3}
                  label="Last updated"
                >
                  {formatDate(
                    ticket.lastUpdatedDate,
                  )}
                </DetailRow>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <h2 className="text-lg font-bold text-slate-900">
                Status timeline
              </h2>

              <div className="mt-6">
                {timeline.map((item, index) => (
                  <div
                    key={item.statusName}
                    className="relative flex gap-4 pb-7 last:pb-0"
                  >
                    {index < timeline.length - 1 && (
                      <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-slate-200" />
                    )}

                    <div
                      className={[
                        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                        item.completed
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-300',
                      ].join(' ')}
                    >
                      {item.completed ? (
                        <Check
                          size={15}
                          strokeWidth={3}
                        />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </div>

                    <div className="pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={[
                            'text-sm font-bold',
                            item.completed
                              ? 'text-slate-900'
                              : 'text-slate-500',
                          ].join(' ')}
                        >
                          {item.statusName}
                        </p>

                        {item.current && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                            Current
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Link
              to="/tickets"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              View all my tickets
              <ChevronRight size={18} />
            </Link>
          </aside>
        </div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close delete confirmation"
            onClick={() =>
              !deleting &&
              setDeleteModalOpen(false)
            }
            className="absolute inset-0"
          />

          <section className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <AlertTriangle size={23} />
              </div>

              <button
                type="button"
                onClick={() =>
                  setDeleteModalOpen(false)
                }
                disabled={deleting}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Delete this ticket?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              The ticket will be removed from your active list. This
              action cannot be undone from the employee portal.
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-blue-600">
                {ticket.referenceNumber}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                {ticket.title}
              </p>
            </div>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-700">
                  {deleteError}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setDeleteModalOpen(false)
                }
                disabled={deleting}
                className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Keep ticket
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={17} />
                )}

                {deleting
                  ? 'Deleting...'
                  : 'Delete ticket'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export default TicketDetailsPage