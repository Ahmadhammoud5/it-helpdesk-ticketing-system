import {
  useCallback,
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
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Edit3,
  FileText,
  Hash,
  History,
  Info,
  LoaderCircle,
  Paperclip,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Tag,
  Timer,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react'

import {
  assignTicket,
  createTicketComment,
  deleteTicket,
  deleteTicketAttachment,
  deleteTicketComment,
  downloadTicketAttachment,
  getSupportAgents,
  getTicketAssignmentHistory,
  getTicketAttachments,
  getTicketById,
  getTicketComments,
  getTicketTimeline,
  getTicketWorkTime,
  unassignTicket,
  updateTicketComment,
  updateTicketStatus,
  uploadTicketAttachments,
} from '../api/ticketApi'
import { getStatuses } from '../api/lookupApi'
import { subscribeToPresence } from '../api/notificationHub'
import { useAuth } from '../auth/useAuth'
import {
  getRoleContext,
  ROLES,
} from '../auth/roles'
import {
  attachmentAccept,
  formatFileSize,
  validateAttachmentFiles,
} from '../utils/ticketAttachments'
import { formatPresence } from '../utils/presence'

const statusStyles = {
  Open:
    'bg-blue-50 text-blue-700 ring-blue-600/10',
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

const statusDescriptions = {
  Open: 'The ticket is waiting for review.',
  'In Progress':
    'An authorised staff member is actively working on the ticket.',
  Pending:
    'Work is paused while additional information or action is required.',
  Resolved:
    'The reported problem has been resolved.',
  Closed:
    'The completed ticket has been formally closed.',
  Cancelled:
    'The ticket was cancelled and cannot be reopened.',
}

const allowedTransitions = {
  1: [2, 3, 6],
  2: [3, 4, 6],
  3: [2, 4, 6],
  4: [5, 2],
  5: [],
  6: [],
}

function normalizeUtcDateValue(dateValue) {
  if (typeof dateValue !== 'string') {
    return dateValue
  }

  let normalizedValue = dateValue.trim()

  normalizedValue = normalizedValue.replace(
    /(\.\d{3})\d+/,
    '$1',
  )

  const hasTimeZone =
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(
      normalizedValue,
    )

  return hasTimeZone
    ? normalizedValue
    : `${normalizedValue}Z`
}

function formatDate(dateValue) {
  if (!dateValue) {
    return 'N/A'
  }

  const date = new Date(
    normalizeUtcDateValue(dateValue),
  )

  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatDuration(minutesValue) {
  const totalMinutes = Number(minutesValue) || 0
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}

function getTimelineTitle(item) {
  if (item.eventType === 'Created') {
    return 'Ticket created'
  }

  if (item.fieldName === 'Status') {
    return `${item.oldValue} -> ${item.newValue}`
  }

  if (item.fieldName === 'AssignedToUser') {
    return 'Ticket assignment updated'
  }

  if (item.fieldName === 'CancellationReason') {
    return 'Cancellation reason'
  }

  if (
    item.fieldName === 'AccumulatedWorkMinutes'
  ) {
    return 'Active work time updated'
  }

  return `${item.fieldName} updated`
}

function getTimelineDescription(item) {
  if (item.eventType === 'Created') {
    return 'The ticket entered the Open status.'
  }

  if (
    item.fieldName === 'CancellationReason'
  ) {
    return item.newValue
  }

  if (
    item.fieldName === 'AssignedToUser'
  ) {
    return `${item.oldValue ?? 'Unassigned'} -> ${
      item.newValue ?? 'Unassigned'
    }`
  }

  if (
    item.fieldName === 'AccumulatedWorkMinutes'
  ) {
    return `${item.oldValue ?? 0} -> ${
      item.newValue ?? 0
    } minutes`
  }

  return item.newValue
    ? `New value: ${item.newValue}`
    : 'The ticket record was updated.'
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="h-[620px] rounded-2xl border border-slate-200 bg-white" />
        <div className="h-[620px] rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  )
}

function TicketDetailsPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [creationNotice] = useState(() => ({
    ticketId,
    ticketCreated:
      location.state?.ticketCreated === true,
    attachmentUploadError:
      location.state?.attachmentUploadError ?? '',
  }))

  const [ticket, setTicket] = useState(null)
  const [statuses, setStatuses] = useState([])
  const [timeline, setTimeline] = useState([])
  const [workTime, setWorkTime] = useState(null)
  const [comments, setComments] = useState([])

  const [attachments, setAttachments] =
    useState([])

  const [selectedFiles, setSelectedFiles] =
    useState([])

  const [
    attachmentInputKey,
    setAttachmentInputKey,
  ] = useState(0)

  const [
    uploadingAttachments,
    setUploadingAttachments,
  ] = useState(false)

  const [
    downloadingAttachmentId,
    setDownloadingAttachmentId,
  ] = useState(null)

  const [
    deletingAttachmentId,
    setDeletingAttachmentId,
  ] = useState(null)

  const [
    attachmentError,
    setAttachmentError,
  ] = useState('')

  const [
    attachmentSuccess,
    setAttachmentSuccess,
  ] = useState('')

  const [supportAgents, setSupportAgents] =
    useState([])
  const [
    assignmentHistory,
    setAssignmentHistory,
  ] = useState([])
  const [
    selectedSupportAgentId,
    setSelectedSupportAgentId,
  ] = useState('')
  const [
    assignmentReason,
    setAssignmentReason,
  ] = useState('')
  const [
    assignmentIsEscalation,
    setAssignmentIsEscalation,
  ] = useState(false)
  const [
    savingAssignment,
    setSavingAssignment,
  ] = useState(false)
  const [
    unassigningTicket,
    setUnassigningTicket,
  ] = useState(false)
  const [
    assignmentError,
    setAssignmentError,
  ] = useState('')
  const [
    assignmentSuccess,
    setAssignmentSuccess,
  ] = useState('')

  const [
    newCommentText,
    setNewCommentText,
  ] = useState('')
  const [
    newCommentIsInternal,
    setNewCommentIsInternal,
  ] = useState(false)
  const [
    submittingComment,
    setSubmittingComment,
  ] = useState(false)
  const [commentError, setCommentError] =
    useState('')
  const [commentSuccess, setCommentSuccess] =
    useState('')

  const [
    editingCommentId,
    setEditingCommentId,
  ] = useState(null)
  const [
    editCommentText,
    setEditCommentText,
  ] = useState('')
  const [
    savingCommentId,
    setSavingCommentId,
  ] = useState(null)
  const [
    deletingCommentId,
    setDeletingCommentId,
  ] = useState(null)
  const [
    commentActionErrorId,
    setCommentActionErrorId,
  ] = useState(null)
  const [
    commentActionError,
    setCommentActionError,
  ] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] =
    useState(false)

  const [
    workflowModalOpen,
    setWorkflowModalOpen,
  ] = useState(false)
  const [
    selectedStatusId,
    setSelectedStatusId,
  ] = useState('')
  const [statusReason, setStatusReason] =
    useState('')
  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false)
  const [
    workflowError,
    setWorkflowError,
  ] = useState('')
  const [
    workflowSuccess,
    setWorkflowSuccess,
  ] = useState('')

  const [
    deleteModalOpen,
    setDeleteModalOpen,
  ] = useState(false)
  const [deleting, setDeleting] =
    useState(false)
  const [deleteError, setDeleteError] =
    useState('')

  const ticketCreated =
    creationNotice.ticketId === ticketId &&
    creationNotice.ticketCreated
  const attachmentUploadError =
    creationNotice.attachmentUploadError

  const roles = user?.roles ?? []
  const currentUserId = Number(user?.userId)
  const roleContext = getRoleContext(user)

  const isAdmin = roles.includes(ROLES.admin)
  const isManager = roles.includes(ROLES.manager)
  const isAgent = roles.includes(
    ROLES.supportAgent,
  )
  const isEmployee = roles.includes(ROLES.employee)

  const canManageAssignments =
    isAdmin || isManager

  const isFinalTicket =
    ticket?.statusName === 'Closed' ||
    ticket?.statusName === 'Cancelled'

  const isResolvedTicket =
    ticket?.statusName === 'Resolved'

  const hasOperationalRole =
    isAdmin || isManager || isAgent

  const attachmentsAreReadOnly =
    isFinalTicket ||
    (ticket?.statusName === 'Resolved' &&
      !hasOperationalRole)

  const isOwner =
    ticket &&
    currentUserId === ticket.createdByUserId

  const isAssignedAgent =
    ticket &&
    isAgent &&
    currentUserId === ticket.assignedToUserId

  const canCreateInternalNote =
    isAdmin || isManager || isAssignedAgent

  const canEditTicket =
    isAdmin ||
    (isEmployee &&
      isOwner &&
      !isFinalTicket &&
      !isResolvedTicket)

  const canManageFullWorkflow =
    isAdmin ||
    isManager ||
    isAssignedAgent

  const allowedStatusIds = useMemo(() => {
    if (!ticket) {
      return []
    }

    const transitionIds =
      allowedTransitions[ticket.statusId] ?? []

    if (canManageFullWorkflow) {
      return transitionIds
    }

    if (isEmployee && isOwner) {
      return transitionIds.filter(
        (statusId) => statusId === 6,
      )
    }

    return []
  }, [
    ticket,
    canManageFullWorkflow,
    isEmployee,
    isOwner,
  ])

  const availableStatuses = useMemo(
    () =>
      statuses.filter((status) =>
        allowedStatusIds.includes(status.id),
      ),
    [statuses, allowedStatusIds],
  )

  const selectedStatus = statuses.find(
    (status) =>
      status.id === Number(selectedStatusId),
  )

  const selectedAgentIsCurrent =
    Boolean(ticket?.assignedToUserId) &&
    Number(selectedSupportAgentId) ===
      Number(ticket?.assignedToUserId)

  const assignmentOperationRunning =
    savingAssignment || unassigningTicket

  const loadPageData = useCallback(
    async () => {
      setLoading(true)
      setError('')
      setNotFound(false)

      try {
        const [
          ticketData,
          statusData,
          timelineData,
          workTimeData,
          commentData,
          attachmentData,
          assignmentHistoryData,
          supportAgentData,
        ] = await Promise.all([
          getTicketById(ticketId),
          getStatuses(),
          getTicketTimeline(ticketId),
          getTicketWorkTime(ticketId),
          getTicketComments(ticketId),
          getTicketAttachments(ticketId),
          getTicketAssignmentHistory(
            ticketId,
          ).catch((requestError) => {
            if (
              requestError.response?.status ===
              403
            ) {
              return []
            }

            throw requestError
          }),
          canManageAssignments
            ? getSupportAgents()
            : Promise.resolve([]),
        ])

        setTicket(ticketData)
        setStatuses(statusData)
        setTimeline(timelineData)
        setWorkTime(workTimeData)
        setComments(commentData)
        setAttachments(attachmentData)
        setAssignmentHistory(
          assignmentHistoryData,
        )
        setSupportAgents(supportAgentData)

        setSelectedSupportAgentId(
          ticketData.assignedToUserId
            ? String(
                ticketData.assignedToUserId,
              )
            : '',
        )
      } catch (requestError) {
        if (
          requestError.response?.status === 404
        ) {
          setNotFound(true)
        } else {
          setError(
            requestError.response?.data
              ?.message ??
              'Unable to load this ticket. Make sure the backend is running and try again.',
          )
        }
      } finally {
        setLoading(false)
      }
    },
    [ticketId, canManageAssignments],
  )

  async function refreshWorkflowData() {
    const [
      ticketData,
      timelineData,
      workTimeData,
    ] = await Promise.all([
      getTicketById(ticketId),
      getTicketTimeline(ticketId),
      getTicketWorkTime(ticketId),
    ])

    setTicket(ticketData)
    setTimeline(timelineData)
    setWorkTime(workTimeData)
  }

  async function refreshAssignmentData() {
    const [
      ticketData,
      timelineData,
      assignmentHistoryData,
    ] = await Promise.all([
      getTicketById(ticketId),
      getTicketTimeline(ticketId),
      getTicketAssignmentHistory(
        ticketId,
      ).catch((requestError) => {
        if (
          requestError.response?.status === 403
        ) {
          return []
        }

        throw requestError
      }),
    ])

    setTicket(ticketData)
    setTimeline(timelineData)
    setAssignmentHistory(
      assignmentHistoryData,
    )

    setSelectedSupportAgentId(
      ticketData.assignedToUserId
        ? String(ticketData.assignedToUserId)
        : '',
    )
  }

  useEffect(() => {
    loadPageData()
  }, [loadPageData])

  useEffect(() => {
    if (!canManageAssignments) {
      return undefined
    }

    return subscribeToPresence((presence) => {
      setSupportAgents((current) =>
        current.map((agent) =>
          agent.userId === presence.userId
            ? {
                ...agent,
                isOnline: presence.isOnline,
                lastSeenUtc:
                  presence.lastSeenUtc ??
                  agent.lastSeenUtc,
              }
            : agent,
        ),
      )
    })
  }, [canManageAssignments])

  useEffect(() => {
    if (!ticketCreated) {
      return
    }

    navigate(location.pathname, {
      replace: true,
      state: {},
    })
  }, [
    ticketCreated,
    navigate,
    location.pathname,
  ])

  useEffect(() => {
    if (!workTime?.isCurrentlyWorking) {
      return undefined
    }

    const intervalId = window.setInterval(
      async () => {
        try {
          const workTimeData =
            await getTicketWorkTime(ticketId)

          setWorkTime(workTimeData)
        } catch {
          // Keep the displayed value when polling fails.
        }
      },
      60000,
    )

    return () =>
      window.clearInterval(intervalId)
  }, [
    ticketId,
    workTime?.isCurrentlyWorking,
  ])

  function clearAssignmentMessages() {
    setAssignmentError('')
    setAssignmentSuccess('')
  }

  function openWorkflowModal() {
    const firstStatus = availableStatuses[0]

    setSelectedStatusId(
      firstStatus
        ? String(firstStatus.id)
        : '',
    )
    setStatusReason('')
    setWorkflowError('')
    setWorkflowModalOpen(true)
  }

  async function handleStatusUpdate(event) {
    event.preventDefault()

    const newStatusId = Number(
      selectedStatusId,
    )
    const reason = statusReason.trim()

    if (!newStatusId) {
      setWorkflowError(
        'Select the next ticket status.',
      )
      return
    }

    if (newStatusId === 6 && !reason) {
      setWorkflowError(
        'A cancellation reason is required.',
      )
      return
    }

    setUpdatingStatus(true)
    setWorkflowError('')
    setWorkflowSuccess('')

    try {
      const result =
        await updateTicketStatus(ticket.id, {
          newStatusId,
          reason: reason || null,
        })

      await refreshWorkflowData()

      setWorkflowModalOpen(false)
      setSelectedStatusId('')
      setStatusReason('')
      setWorkflowSuccess(
        `Status updated from ${result.previousStatusName} to ${result.currentStatusName}.`,
      )
    } catch (requestError) {
      setWorkflowError(
        requestError.response?.data
          ?.message ??
          'Unable to update the ticket status.',
      )
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleAssignTicket(event) {
    event.preventDefault()

    const supportAgentId = Number(
      selectedSupportAgentId,
    )
    const reason =
      assignmentReason.trim()
    const wasAlreadyAssigned = Boolean(
      ticket.assignedToUserId,
    )

    clearAssignmentMessages()

    if (!canManageAssignments) {
      setAssignmentError(
        'You are not authorised to assign tickets.',
      )
      return
    }

    if (isFinalTicket) {
      setAssignmentError(
        'Closed or cancelled tickets cannot be assigned.',
      )
      return
    }

    if (!supportAgentId) {
      setAssignmentError(
        'Select an IT support agent.',
      )
      return
    }

    if (selectedAgentIsCurrent) {
      setAssignmentError(
        'This ticket is already assigned to the selected agent.',
      )
      return
    }

    setSavingAssignment(true)

    try {
      const result = await assignTicket(
        ticket.id,
        {
          supportAgentId,
          isEscalation:
            assignmentIsEscalation,
          assignmentReason:
            reason || null,
        },
      )

      await refreshAssignmentData()

      setAssignmentReason('')
      setAssignmentIsEscalation(false)

      setAssignmentSuccess(
        wasAlreadyAssigned
          ? `Ticket reassigned to ${result.assignedToName}.`
          : `Ticket assigned to ${result.assignedToName}.`,
      )
    } catch (requestError) {
      setAssignmentError(
        requestError.response?.data
          ?.message ??
          'Unable to assign the ticket.',
      )
    } finally {
      setSavingAssignment(false)
    }
  }

  async function handleUnassignTicket() {
    const reason =
      assignmentReason.trim()

    clearAssignmentMessages()

    if (!canManageAssignments) {
      setAssignmentError(
        'You are not authorised to unassign tickets.',
      )
      return
    }

    if (!ticket.assignedToUserId) {
      setAssignmentError(
        'The ticket is not currently assigned.',
      )
      return
    }

    if (isFinalTicket) {
      setAssignmentError(
        'Closed or cancelled tickets cannot be unassigned.',
      )
      return
    }

    const assignedAgentName =
      ticket.assignedToName ??
      'the current agent'

    const confirmed = window.confirm(
      `Unassign ${assignedAgentName} from this ticket?`,
    )

    if (!confirmed) {
      return
    }

    setUnassigningTicket(true)

    try {
      const result = await unassignTicket(
        ticket.id,
        {
          assignmentReason:
            reason || null,
        },
      )

      await refreshAssignmentData()

      setAssignmentReason('')
      setAssignmentIsEscalation(false)

      setAssignmentSuccess(
        `Ticket unassigned from ${result.assignedToName}.`,
      )
    } catch (requestError) {
      setAssignmentError(
        requestError.response?.data
          ?.message ??
          'Unable to unassign the ticket.',
      )
    } finally {
      setUnassigningTicket(false)
    }
  }

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
        requestError.response?.data
          ?.message ??
          'Unable to delete this ticket. Please try again.',
      )
    } finally {
      setDeleting(false)
    }
  }

  async function handleCreateComment(event) {
    event.preventDefault()

    const commentText =
      newCommentText.trim()

    setCommentError('')
    setCommentSuccess('')

    if (isFinalTicket) {
      setCommentError(
        'Comments cannot be added to closed or cancelled tickets.',
      )
      return
    }

    if (!commentText) {
      setCommentError(
        'Comment text is required.',
      )
      return
    }

    if (commentText.length > 5000) {
      setCommentError(
        'Comment text cannot exceed 5000 characters.',
      )
      return
    }

    const creatingInternalNote =
      canCreateInternalNote &&
      newCommentIsInternal

    setSubmittingComment(true)

    try {
      const createdComment =
        await createTicketComment(
          ticketId,
          {
            commentText,
            isInternal:
              creatingInternalNote,
          },
        )

      setComments(
        (currentComments) => [
          ...currentComments,
          createdComment,
        ],
      )

      setNewCommentText('')
      setNewCommentIsInternal(false)

      setCommentSuccess(
        creatingInternalNote
          ? 'Internal note added successfully.'
          : 'Reply posted successfully.',
      )
    } catch (requestError) {
      setCommentError(
        requestError.response?.data
          ?.message ??
          'Unable to post the comment. Try again.',
      )
    } finally {
      setSubmittingComment(false)
    }
  }

  function startEditingComment(comment) {
    setEditingCommentId(comment.id)
    setEditCommentText(
      comment.commentText,
    )
    setCommentActionErrorId(null)
    setCommentActionError('')
  }

  function cancelEditingComment() {
    setEditingCommentId(null)
    setEditCommentText('')
    setCommentActionErrorId(null)
    setCommentActionError('')
  }

  async function handleUpdateComment(
    event,
    commentId,
  ) {
    event.preventDefault()

    const commentText =
      editCommentText.trim()

    setCommentActionErrorId(null)
    setCommentActionError('')

    if (!commentText) {
      setCommentActionErrorId(commentId)
      setCommentActionError(
        'Comment text is required.',
      )
      return
    }

    if (commentText.length > 5000) {
      setCommentActionErrorId(commentId)
      setCommentActionError(
        'Comment text cannot exceed 5000 characters.',
      )
      return
    }

    setSavingCommentId(commentId)

    try {
      const updatedComment =
        await updateTicketComment(
          ticketId,
          commentId,
          {
            commentText,
          },
        )

      setComments(
        (currentComments) =>
          currentComments.map((comment) =>
            comment.id === commentId
              ? updatedComment
              : comment,
          ),
      )

      setEditingCommentId(null)
      setEditCommentText('')
    } catch (requestError) {
      setCommentActionErrorId(commentId)
      setCommentActionError(
        requestError.response?.data
          ?.message ??
          'Unable to update this comment.',
      )
    } finally {
      setSavingCommentId(null)
    }
  }

  async function handleDeleteComment(
    commentId,
  ) {
    const confirmed = window.confirm(
      'Delete this comment permanently?',
    )

    if (!confirmed) {
      return
    }

    setCommentActionErrorId(null)
    setCommentActionError('')
    setDeletingCommentId(commentId)

    try {
      await deleteTicketComment(
        ticketId,
        commentId,
      )

      setComments(
        (currentComments) =>
          currentComments.filter(
            (comment) =>
              comment.id !== commentId,
          ),
      )

      if (
        editingCommentId === commentId
      ) {
        setEditingCommentId(null)
        setEditCommentText('')
      }
    } catch (requestError) {
      setCommentActionErrorId(commentId)
      setCommentActionError(
        requestError.response?.data
          ?.message ??
          'Unable to delete this comment.',
      )
    } finally {
      setDeletingCommentId(null)
    }
  }

  function clearAttachmentMessages() {
    setAttachmentError('')
    setAttachmentSuccess('')
  }

  function handleAttachmentSelection(event) {
    const files = Array.from(
      event.target.files ?? [],
    )

    clearAttachmentMessages()

    const currentStoredSize =
      attachments.reduce(
        (total, attachment) =>
          total +
          (Number(
            attachment.fileSizeBytes,
          ) || 0),
        0,
      )

    const validationError =
      validateAttachmentFiles(
        files,
        currentStoredSize,
      )

    if (validationError) {
      setSelectedFiles([])
      event.target.value = ''

      setAttachmentError(validationError)

      return
    }

    setSelectedFiles(files)
  }

  async function handleUploadAttachments(
    event,
  ) {
    event.preventDefault()

    clearAttachmentMessages()

    if (attachmentsAreReadOnly) {
      setAttachmentError(
        'Attachments are read-only for this ticket.',
      )
      return
    }

    if (selectedFiles.length === 0) {
      setAttachmentError(
        'Select at least one file to upload.',
      )

      return
    }

    setUploadingAttachments(true)

    try {
      const uploadedCount =
        selectedFiles.length

      await uploadTicketAttachments(
        ticketId,
        selectedFiles,
      )

      const attachmentData =
        await getTicketAttachments(ticketId)

      setAttachments(attachmentData)
      setSelectedFiles([])

      setAttachmentInputKey(
        (currentKey) => currentKey + 1,
      )

      setAttachmentSuccess(
        uploadedCount === 1
          ? 'File uploaded successfully.'
          : `${uploadedCount} files uploaded successfully.`,
      )
    } catch (requestError) {
      setAttachmentError(
        requestError.response?.data
          ?.message ??
          'Unable to upload the selected files.',
      )
    } finally {
      setUploadingAttachments(false)
    }
  }

  async function handleDownloadAttachment(
    attachment,
  ) {
    clearAttachmentMessages()

    setDownloadingAttachmentId(
      attachment.id,
    )

    try {
      const fileBlob =
        await downloadTicketAttachment(
          ticketId,
          attachment.id,
        )

      const downloadUrl =
        window.URL.createObjectURL(
          fileBlob,
        )

      const link =
        document.createElement('a')

      link.href = downloadUrl
      link.download =
        attachment.originalFileName

      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(
        downloadUrl,
      )
    } catch {
      setAttachmentError(
        'Unable to download this attachment.',
      )
    } finally {
      setDownloadingAttachmentId(null)
    }
  }

  async function handleDeleteAttachment(
    attachment,
  ) {
    if (attachmentsAreReadOnly) {
      setAttachmentError(
        'Attachments are read-only for this ticket.',
      )
      return
    }

    const confirmed = window.confirm(
      `Delete ${attachment.originalFileName}?`,
    )

    if (!confirmed) {
      return
    }

    clearAttachmentMessages()

    setDeletingAttachmentId(
      attachment.id,
    )

    try {
      await deleteTicketAttachment(
        ticketId,
        attachment.id,
      )

      setAttachments(
        (currentAttachments) =>
          currentAttachments.filter(
            (item) =>
              item.id !== attachment.id,
          ),
      )

      setAttachmentSuccess(
        'Attachment deleted successfully.',
      )
    } catch (requestError) {
      setAttachmentError(
        requestError.response?.data
          ?.message ??
          'Unable to delete this attachment.',
      )
    } finally {
      setDeletingAttachmentId(null)
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
          This ticket does not exist, was
          deleted, or you do not have
          permission to access it.
        </p>

        <Link
          to="/tickets"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <ArrowLeft size={17} />
          Return to {roleContext.ticketsLinkLabel}
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
          onClick={loadPageData}
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
        {ticketCreated && !attachmentUploadError && (
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
                Your support request was
                saved and sent to the IT
                team.
              </p>
            </div>
          </section>
        )}

        {ticketCreated && attachmentUploadError && (
          <section
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
          >
            <AlertTriangle
              size={21}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div>
              <p className="text-sm font-bold text-amber-900">
                Ticket created successfully, but some
                attachments could not be uploaded.
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                {attachmentUploadError}
              </p>
            </div>
          </section>
        )}

        {workflowSuccess && (
          <section className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={21}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-sm font-bold text-emerald-800">
                  Workflow updated
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  {workflowSuccess}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setWorkflowSuccess('')
              }
              className="rounded-lg p-1 text-emerald-600 transition hover:bg-emerald-100"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </section>
        )}

        <section>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to {roleContext.ticketsLinkLabel}
          </Link>

          <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    'inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset',
                    statusStyles[
                      ticket.statusName
                    ] ??
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

                  {ticket.priorityName}{' '}
                  priority
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
              {availableStatuses.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    openWorkflowModal
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <RefreshCw size={17} />
                  Update status
                </button>
              )}

              {canEditTicket && (
                <>
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
                </>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Description
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Information submitted
                  with this support
                  request.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {ticket.description}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Paperclip size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Attachments
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Screenshots, documents,
                      logs and supporting
                      files.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {attachments.length}{' '}
                  {attachments.length === 1
                    ? 'file'
                    : 'files'}
                </span>
              </div>

              {attachmentsAreReadOnly ? (
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-600 sm:px-6">
                  Attachments are read-only because this ticket is{' '}
                  {ticket.statusName === 'Resolved'
                    ? 'resolved'
                    : ticket.statusName.toLowerCase()}.
                </div>
              ) : (
                <form
                  onSubmit={
                    handleUploadAttachments
                  }
                  className="border-b border-slate-200 p-5 sm:p-6"
                >
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Add files
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        PNG, JPG, WEBP, PDF,
                        TXT, DOCX or XLSX.
                        Maximum 5 files per
                        upload and 10 MB each.
                      </p>
                    </div>

                    <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
                      <Paperclip size={16} />

                      Choose files

                      <input
                        key={
                          attachmentInputKey
                        }
                        type="file"
                        multiple
                        accept={
                          attachmentAccept
                        }
                        onChange={
                          handleAttachmentSelection
                        }
                        disabled={
                          uploadingAttachments
                        }
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {selectedFiles.length >
                    0 && (
                    <div className="mt-4 space-y-2">
                      {selectedFiles.map(
                        (file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <FileText
                                size={16}
                                className="shrink-0 text-slate-400"
                              />

                              <p className="truncate text-xs font-semibold text-slate-700">
                                {file.name}
                              </p>
                            </div>

                            <span className="shrink-0 text-[11px] font-medium text-slate-400">
                              {formatFileSize(
                                file.size,
                              )}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-slate-500">
                      {selectedFiles.length ===
                      0
                        ? 'No files selected.'
                        : `${selectedFiles.length} ${
                            selectedFiles.length ===
                            1
                              ? 'file'
                              : 'files'
                          } selected.`}
                    </p>

                    <button
                      type="submit"
                      disabled={
                        uploadingAttachments ||
                        selectedFiles.length ===
                          0
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {uploadingAttachments ? (
                        <LoaderCircle
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Upload size={16} />
                      )}

                      {uploadingAttachments
                        ? 'Uploading...'
                        : 'Upload'}
                    </button>
                  </div>
                </div>

                {attachmentError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {attachmentError}
                  </div>
                )}

                {attachmentSuccess && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {attachmentSuccess}
                  </div>
                )}
                </form>
              )}

              {attachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <FileText size={21} />
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-slate-800">
                    No attachments yet
                  </h3>

                  <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                    Uploaded screenshots,
                    documents and logs will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {attachments.map(
                    (attachment) => {
                      const canDeleteAttachment =
                        !attachmentsAreReadOnly &&
                        (isAdmin ||
                          isManager ||
                          Number(
                            attachment.uploadedByUserId,
                          ) === currentUserId)

                      return (
                        <article
                          key={
                            attachment.id
                          }
                          className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                              <FileText
                                size={18}
                              />
                            </div>

                            <div className="min-w-0">
                              <p
                                className="truncate text-sm font-bold text-slate-900"
                                title={
                                  attachment.originalFileName
                                }
                              >
                                {
                                  attachment.originalFileName
                                }
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {formatFileSize(
                                  attachment.fileSizeBytes,
                                )}{' '}
                                - Uploaded by{' '}
                                {attachment.uploadedByName ||
                                  'Unknown user'}{' '}
                                -{' '}
                                {formatDate(
                                  attachment.createdDate,
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadAttachment(
                                  attachment,
                                )
                              }
                              disabled={
                                downloadingAttachmentId ===
                                  attachment.id ||
                                deletingAttachmentId ===
                                  attachment.id
                              }
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {downloadingAttachmentId ===
                              attachment.id ? (
                                <LoaderCircle
                                  size={14}
                                  className="animate-spin"
                                />
                              ) : (
                                <Download
                                  size={14}
                                />
                              )}

                              {downloadingAttachmentId ===
                              attachment.id
                                ? 'Downloading...'
                                : 'Download'}
                            </button>

                            {canDeleteAttachment && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteAttachment(
                                    attachment,
                                  )
                                }
                                disabled={
                                  downloadingAttachmentId ===
                                    attachment.id ||
                                  deletingAttachmentId ===
                                    attachment.id
                                }
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingAttachmentId ===
                                attachment.id ? (
                                  <LoaderCircle
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={14}
                                  />
                                )}

                                {deletingAttachmentId ===
                                attachment.id
                                  ? 'Deleting...'
                                  : 'Delete'}
                              </button>
                            )}
                          </div>
                        </article>
                      )
                    },
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Ticket workflow
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Status rules, active
                    work time and
                    completion dates.
                  </p>
                </div>

                {availableStatuses.length >
                  0 && (
                  <button
                    type="button"
                    onClick={
                      openWorkflowModal
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <RefreshCw size={16} />
                    Change status
                  </button>
                )}
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Current status
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <ShieldCheck
                        size={20}
                      />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {ticket.statusName}
                      </p>

                      <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        {statusDescriptions[
                          ticket.statusName
                        ] ??
                          'Ticket workflow status.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Active working time
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                      <Timer size={20} />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {formatDuration(
                          workTime?.totalWorkMinutes,
                        )}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {workTime?.isCurrentlyWorking
                          ? `Active session: ${formatDuration(
                              workTime.currentSessionMinutes,
                            )}`
                          : 'No active work session'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Total elapsed time
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                      <Clock3 size={20} />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {formatDuration(
                          workTime?.elapsedMinutes,
                        )}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        From creation until
                        the latest final
                        state
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Work session
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className={[
                        'flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm',
                        workTime?.isCurrentlyWorking
                          ? 'text-emerald-600'
                          : 'text-slate-400',
                      ].join(' ')}
                    >
                      <PlayCircle
                        size={20}
                      />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {workTime?.isCurrentlyWorking
                          ? 'Running'
                          : 'Stopped'}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {workTime?.workStartedAtUtc
                          ? `Started ${formatDate(
                              workTime.workStartedAtUtc,
                            )}`
                          : 'Starts when status becomes In Progress'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Communication
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Public replies and
                    authorised internal
                    notes.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {comments.length}{' '}
                  {comments.length === 1
                    ? 'comment'
                    : 'comments'}
                </span>
              </div>

              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Info size={25} />
                  </div>

                  <h3 className="mt-4 font-bold text-slate-900">
                    No comments yet
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Ticket communication
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {comments.map(
                    (comment) => (
                      <article
                        key={comment.id}
                        className={
                          comment.isInternal
                            ? 'bg-amber-50/60 px-5 py-5 sm:px-6'
                            : 'px-5 py-5 sm:px-6'
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                            {comment.userName
                              ?.trim()
                              .charAt(0)
                              .toUpperCase() ||
                              '?'}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-slate-900">
                                    {
                                      comment.userName
                                    }
                                  </p>

                                  {comment.isInternal && (
                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                                      Internal
                                      note
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  {formatDate(
                                    comment.createdDate,
                                  )}
                                  {comment.updatedDate
                                    ? ' - Edited'
                                    : ''}
                                </p>
                              </div>

                              {(comment.canEdit ||
                                comment.canDelete) && (
                                <div className="flex shrink-0 items-center gap-2">
                                  {comment.canEdit &&
                                    !isFinalTicket && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          startEditingComment(
                                            comment,
                                          )
                                        }
                                        disabled={
                                          savingCommentId ===
                                            comment.id ||
                                          deletingCommentId ===
                                            comment.id
                                        }
                                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <Edit3
                                          size={
                                            14
                                          }
                                        />
                                        Edit
                                      </button>
                                    )}

                                  {comment.canDelete && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteComment(
                                          comment.id,
                                        )
                                      }
                                      disabled={
                                        savingCommentId ===
                                          comment.id ||
                                        deletingCommentId ===
                                          comment.id
                                      }
                                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {deletingCommentId ===
                                      comment.id ? (
                                        <LoaderCircle
                                          size={
                                            14
                                          }
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Trash2
                                          size={
                                            14
                                          }
                                        />
                                      )}

                                      {deletingCommentId ===
                                      comment.id
                                        ? 'Deleting...'
                                        : 'Delete'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {editingCommentId ===
                            comment.id ? (
                              <form
                                onSubmit={(
                                  event,
                                ) =>
                                  handleUpdateComment(
                                    event,
                                    comment.id,
                                  )
                                }
                                className="mt-4"
                              >
                                <textarea
                                  value={
                                    editCommentText
                                  }
                                  onChange={(
                                    event,
                                  ) => {
                                    setEditCommentText(
                                      event
                                        .target
                                        .value,
                                    )
                                    setCommentActionErrorId(
                                      null,
                                    )
                                    setCommentActionError(
                                      '',
                                    )
                                  }}
                                  maxLength={
                                    5000
                                  }
                                  rows={4}
                                  disabled={
                                    savingCommentId ===
                                    comment.id
                                  }
                                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                                />

                                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                                  <span className="text-xs font-medium text-slate-400">
                                    {
                                      editCommentText.length
                                    }
                                    /5000
                                  </span>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={
                                        cancelEditingComment
                                      }
                                      disabled={
                                        savingCommentId ===
                                        comment.id
                                      }
                                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <X
                                        size={
                                          14
                                        }
                                      />
                                      Cancel
                                    </button>

                                    <button
                                      type="submit"
                                      disabled={
                                        savingCommentId ===
                                          comment.id ||
                                        !editCommentText.trim()
                                      }
                                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                      {savingCommentId ===
                                        comment.id && (
                                        <LoaderCircle
                                          size={
                                            14
                                          }
                                          className="animate-spin"
                                        />
                                      )}

                                      {savingCommentId ===
                                      comment.id
                                        ? 'Saving...'
                                        : 'Save changes'}
                                    </button>
                                  </div>
                                </div>

                                {commentActionErrorId ===
                                  comment.id &&
                                  commentActionError && (
                                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                      {
                                        commentActionError
                                      }
                                    </div>
                                  )}
                              </form>
                            ) : (
                              <>
                                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                  {
                                    comment.commentText
                                  }
                                </p>

                                {commentActionErrorId ===
                                  comment.id &&
                                  commentActionError && (
                                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                      {
                                        commentActionError
                                      }
                                    </div>
                                  )}
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}

              <form
                onSubmit={
                  handleCreateComment
                }
                className="border-t border-slate-200 p-5 sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Add a reply
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {isFinalTicket
                        ? 'Comments are disabled because this ticket is closed or cancelled.'
                        : 'Send a public reply or an authorised internal note.'}
                    </p>
                  </div>

                  {canCreateInternalNote &&
                    !isFinalTicket && (
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={
                            newCommentIsInternal
                          }
                          onChange={(
                            event,
                          ) => {
                            setNewCommentIsInternal(
                              event.target
                                .checked,
                            )
                            setCommentError(
                              '',
                            )
                            setCommentSuccess(
                              '',
                            )
                          }}
                          disabled={
                            submittingComment
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />

                        Internal note
                      </label>
                    )}
                </div>

                <textarea
                  value={newCommentText}
                  onChange={(event) => {
                    setNewCommentText(
                      event.target.value,
                    )
                    setCommentError('')
                    setCommentSuccess('')
                  }}
                  maxLength={5000}
                  rows={5}
                  disabled={
                    isFinalTicket ||
                    submittingComment
                  }
                  placeholder={
                    isFinalTicket
                      ? 'Comments are disabled for this ticket.'
                      : newCommentIsInternal
                        ? 'Write a private note for support staff...'
                        : 'Write a public reply...'
                  }
                  className="mt-4 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-slate-400">
                    {newCommentText.length}
                    /5000
                  </span>

                  <button
                    type="submit"
                    disabled={
                      isFinalTicket ||
                      submittingComment ||
                      !newCommentText.trim()
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {submittingComment && (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    {submittingComment
                      ? 'Posting...'
                      : newCommentIsInternal
                        ? 'Add internal note'
                        : 'Post reply'}
                  </button>
                </div>

                {commentError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {commentError}
                  </div>
                )}

                {commentSuccess && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {commentSuccess}
                  </div>
                )}
              </form>
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
                  {formatDate(
                    ticket.createdDate,
                  )}
                </DetailRow>

                <DetailRow
                  icon={Clock3}
                  label="Last updated"
                >
                  {formatDate(
                    ticket.lastUpdatedDate,
                  )}
                </DetailRow>

                {ticket.resolvedDate && (
                  <DetailRow
                    icon={CheckCircle2}
                    label="Resolved"
                  >
                    {formatDate(
                      ticket.resolvedDate,
                    )}
                  </DetailRow>
                )}

                {ticket.closedDate && (
                  <DetailRow
                    icon={ShieldCheck}
                    label="Closed"
                  >
                    {formatDate(
                      ticket.closedDate,
                    )}
                  </DetailRow>
                )}

                {ticket.cancelledDate && (
                  <DetailRow
                    icon={X}
                    label="Cancelled"
                  >
                    {formatDate(
                      ticket.cancelledDate,
                    )}
                  </DetailRow>
                )}
              </div>
            </section>

            {canManageAssignments && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Ticket assignment
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Assign, reassign or
                      unassign this ticket.
                    </p>
                  </div>

                  <UserRound
                    size={21}
                    className="text-blue-600"
                  />
                </div>

                {isFinalTicket && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-700">
                    Assignment controls are
                    disabled because this
                    ticket is closed or
                    cancelled.
                  </div>
                )}

                <form
                  onSubmit={
                    handleAssignTicket
                  }
                  className="mt-5 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="support-agent"
                      className="text-sm font-bold text-slate-700"
                    >
                      IT support agent
                    </label>

                    <select
                      id="support-agent"
                      value={
                        selectedSupportAgentId
                      }
                      onChange={(
                        event,
                      ) => {
                        setSelectedSupportAgentId(
                          event.target.value,
                        )
                        clearAssignmentMessages()
                      }}
                      disabled={
                        isFinalTicket ||
                        assignmentOperationRunning
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">
                        Select an agent
                      </option>

                      {supportAgents.map(
                        (agent) => (
                          <option
                            key={
                              agent.userId
                            }
                            value={
                              agent.userId
                            }
                          >
                            {agent.fullName} — {formatPresence(agent)}
                          </option>
                        ),
                      )}
                    </select>

                    {supportAgents.length ===
                      0 && (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        No active IT
                        support agents are
                        available.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="assignment-reason"
                      className="text-sm font-bold text-slate-700"
                    >
                      Reason{' '}
                      <span className="font-medium text-slate-400">
                        (optional)
                      </span>
                    </label>

                    <textarea
                      id="assignment-reason"
                      value={
                        assignmentReason
                      }
                      onChange={(
                        event,
                      ) => {
                        setAssignmentReason(
                          event.target.value,
                        )
                        clearAssignmentMessages()
                      }}
                      rows={3}
                      maxLength={255}
                      disabled={
                        isFinalTicket ||
                        assignmentOperationRunning
                      }
                      placeholder="Add context for this assignment operation..."
                      className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {
                        assignmentReason.length
                      }
                      /255
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3">
                    <input
                      type="checkbox"
                      checked={
                        assignmentIsEscalation
                      }
                      onChange={(
                        event,
                      ) => {
                        setAssignmentIsEscalation(
                          event.target
                            .checked,
                        )
                        clearAssignmentMessages()
                      }}
                      disabled={
                        isFinalTicket ||
                        assignmentOperationRunning
                      }
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                    />

                    <span>
                      <span className="block text-sm font-bold text-slate-700">
                        Escalation
                      </span>

                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                        Mark this
                        assignment as an
                        escalation.
                      </span>
                    </span>
                  </label>

                  {assignmentError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {assignmentError}
                    </div>
                  )}

                  {assignmentSuccess && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      {assignmentSuccess}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={
                        isFinalTicket ||
                        assignmentOperationRunning ||
                        !selectedSupportAgentId ||
                        selectedAgentIsCurrent ||
                        supportAgents.length ===
                          0
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {savingAssignment && (
                        <LoaderCircle
                          size={16}
                          className="animate-spin"
                        />
                      )}

                      {savingAssignment
                        ? 'Saving...'
                        : ticket.assignedToUserId
                          ? 'Reassign ticket'
                          : 'Assign ticket'}
                    </button>

                    {ticket.assignedToUserId && (
                      <button
                        type="button"
                        onClick={
                          handleUnassignTicket
                        }
                        disabled={
                          isFinalTicket ||
                          assignmentOperationRunning
                        }
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {unassigningTicket && (
                          <LoaderCircle
                            size={16}
                            className="animate-spin"
                          />
                        )}

                        {unassigningTicket
                          ? 'Unassigning...'
                          : 'Unassign ticket'}
                      </button>
                    )}
                  </div>
                </form>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Assignment history
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Previous and current
                    ticket assignments
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {
                    assignmentHistory.length
                  }
                </span>
              </div>

              {assignmentHistory.length ===
              0 ? (
                <div className="mt-5 rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    No assignments yet
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Assignment activity
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {assignmentHistory.map(
                    (
                      assignment,
                      index,
                    ) => (
                      <article
                        key={`${assignment.assignedToUserId}-${assignment.assignedDate}-${index}`}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {assignment.assignedToName ??
                                'Unknown agent'}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Assigned by{' '}
                              {assignment.assignedByName ??
                                'Unknown user'}
                            </p>
                          </div>

                          <span
                            className={[
                              'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold',
                              assignment.unassignedDate
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-emerald-100 text-emerald-700',
                            ].join(' ')}
                          >
                            {assignment.unassignedDate
                              ? 'Ended'
                              : 'Current'}
                          </span>
                        </div>

                        {assignment.isEscalation && (
                          <span className="mt-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            Escalation
                          </span>
                        )}

                        <div className="mt-3 space-y-1.5 text-xs leading-5 text-slate-500">
                          <p>
                            <span className="font-semibold text-slate-600">
                              Assigned:
                            </span>{' '}
                            {formatDate(
                              assignment.assignedDate,
                            )}
                          </p>

                          {assignment.unassignedDate && (
                            <p>
                              <span className="font-semibold text-slate-600">
                                Unassigned:
                              </span>{' '}
                              {formatDate(
                                assignment.unassignedDate,
                              )}
                            </p>
                          )}
                        </div>

                        {assignment.assignmentReason && (
                          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                              Reason
                            </p>

                            <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
                              {
                                assignment.assignmentReason
                              }
                            </p>
                          </div>
                        )}
                      </article>
                    ),
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Status timeline
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Exact actor, action
                    and time
                  </p>
                </div>

                <History
                  size={21}
                  className="text-blue-600"
                />
              </div>

              <div className="mt-6">
                {timeline.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    No workflow history
                    has been recorded.
                  </p>
                ) : (
                  timeline.map(
                    (item, index) => (
                      <div
                        key={`${item.id}-${item.fieldName}-${item.changedAtUtc}`}
                        className="relative flex gap-4 pb-7 last:pb-0"
                      >
                        {index <
                          timeline.length -
                            1 && (
                          <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-slate-200" />
                        )}

                        <div
                          className={[
                            'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                            item.fieldName ===
                            'CancellationReason'
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-blue-600 bg-blue-600 text-white',
                          ].join(' ')}
                        >
                          <CheckCircle2
                            size={15}
                          />
                        </div>

                        <div className="min-w-0 pt-0.5">
                          <p className="text-sm font-bold text-slate-900">
                            {getTimelineTitle(
                              item,
                            )}
                          </p>

                          <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                            {getTimelineDescription(
                              item,
                            )}
                          </p>

                          <p className="mt-2 text-[11px] font-semibold text-slate-400">
                            {
                              item.changedByName
                            }{' '}
                            -{' '}
                            {formatDate(
                              item.changedAtUtc,
                            )}
                          </p>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </section>

            <Link
              to="/tickets"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              View {roleContext.ticketsLinkLabel}
              <ChevronRight size={18} />
            </Link>
          </aside>
        </div>
      </div>

      {workflowModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close status update"
            onClick={() =>
              !updatingStatus &&
              setWorkflowModalOpen(false)
            }
            className="absolute inset-0"
          />

          <form
            onSubmit={handleStatusUpdate}
            className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <RefreshCw size={23} />
              </div>

              <button
                type="button"
                onClick={() =>
                  setWorkflowModalOpen(
                    false,
                  )
                }
                disabled={updatingStatus}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Update ticket status
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Current status:{' '}
              <span className="font-semibold text-slate-700">
                {ticket.statusName}
              </span>
            </p>

            <div className="mt-5">
              <label
                htmlFor="next-status"
                className="text-sm font-bold text-slate-700"
              >
                Next status
              </label>

              <select
                id="next-status"
                value={selectedStatusId}
                onChange={(event) => {
                  setSelectedStatusId(
                    event.target.value,
                  )
                  setWorkflowError('')
                }}
                className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {availableStatuses.map(
                  (status) => (
                    <option
                      key={status.id}
                      value={status.id}
                    >
                      {status.statusName}
                    </option>
                  ),
                )}
              </select>

              {selectedStatus && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {statusDescriptions[
                    selectedStatus.statusName
                  ] ??
                    'Update the ticket workflow.'}
                </p>
              )}
            </div>

            <div className="mt-5">
              <label
                htmlFor="status-reason"
                className="text-sm font-bold text-slate-700"
              >
                Reason
                {Number(selectedStatusId) ===
                6
                  ? ' *'
                  : ' (optional)'}
              </label>

              <textarea
                id="status-reason"
                value={statusReason}
                onChange={(event) => {
                  setStatusReason(
                    event.target.value,
                  )
                  setWorkflowError('')
                }}
                rows={4}
                maxLength={1000}
                placeholder={
                  Number(
                    selectedStatusId,
                  ) === 6
                    ? 'Explain why this ticket is being cancelled...'
                    : 'Add context for this workflow update...'
                }
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {statusReason.length}
                /1000
              </p>
            </div>

            {workflowError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-700">
                  {workflowError}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setWorkflowModalOpen(
                    false,
                  )
                }
                disabled={updatingStatus}
                className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={updatingStatus}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingStatus ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCw size={17} />
                )}

                {updatingStatus
                  ? 'Updating...'
                  : 'Update status'}
              </button>
            </div>
          </form>
        </div>
      )}

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
              The ticket will be removed
              from the active list while
              its audit records remain
              stored.
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
