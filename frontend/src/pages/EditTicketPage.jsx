import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router'
import {
  AlertCircle,
  ArrowLeft,
  FilePenLine,
  Info,
  LoaderCircle,
  RefreshCw,
  Save,
} from 'lucide-react'

import {
  getTicketById,
  updateTicket,
} from '../api/ticketApi'
import {
  getCategories,
  getPriorities,
} from '../api/lookupApi'
import { useAuth } from '../auth/useAuth'
import { ROLES } from '../auth/roles'
import Skeleton from '../components/ui/Skeleton'
import { useToast } from '../components/toast/useToast'

function EditTicketPage() {
  const { showToast } = useToast()
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [ticket, setTicket] = useState(null)

  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    priorityId: '',
    description: '',
  })

  const [initialForm, setInitialForm] =
    useState(null)

  const [categories, setCategories] =
    useState([])

  const [priorities, setPriorities] =
    useState([])

  const [errors, setErrors] = useState({})
  const [pageError, setPageError] = useState('')
  const [saveError, setSaveError] = useState('')

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] =
    useState(false)

  const [saving, setSaving] = useState(false)

  const isAdmin = user?.roles?.includes(ROLES.admin)
  const isReadOnlyForEmployee =
    !isAdmin &&
    ['Resolved', 'Closed', 'Cancelled'].includes(
      ticket?.statusName,
    )

  const loadPage = useCallback(async () => {
    setLoading(true)
    setPageError('')
    setNotFound(false)

    try {
      const [
        ticketData,
        categoryData,
        priorityData,
      ] = await Promise.all([
        getTicketById(ticketId),
        getCategories(),
        getPriorities(),
      ])

      const loadedForm = {
        title: ticketData.title ?? '',
        categoryId: String(
          ticketData.categoryId ?? '',
        ),
        priorityId: String(
          ticketData.priorityId ?? '',
        ),
        description:
          ticketData.description ?? '',
      }

      setTicket(ticketData)
      setForm(loadedForm)
      setInitialForm(loadedForm)

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : [],
      )

      setPriorities(
        Array.isArray(priorityData)
          ? priorityData
          : [],
      )
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setNotFound(true)
      } else {
        setPageError(
          requestError.response?.data?.message ??
            'Unable to load this ticket for editing.',
        )
      }
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    loadPage()
  }, [loadPage])

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }))

    setSaveError('')
  }

  function validateForm() {
    const validationErrors = {}

    const cleanTitle = form.title.trim()
    const cleanDescription =
      form.description.trim()

    if (cleanTitle.length < 5) {
      validationErrors.title =
        'Enter a clear title containing at least 5 characters.'
    }

    if (cleanTitle.length > 200) {
      validationErrors.title =
        'The subject cannot exceed 200 characters.'
    }

    if (!form.categoryId) {
      validationErrors.categoryId =
        'Select a ticket category.'
    }

    if (!form.priorityId) {
      validationErrors.priorityId =
        'Select the issue priority.'
    }

    if (cleanDescription.length < 10) {
      validationErrors.description =
        'Describe the issue using at least 10 characters.'
    }

    if (cleanDescription.length > 5000) {
      validationErrors.description =
        'The description cannot exceed 5000 characters.'
    }

    return validationErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationErrors =
      validateForm()

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setSaveError('')
    setSaving(true)

    try {
      await updateTicket(ticketId, {
        title: form.title.trim(),
        description:
          form.description.trim(),
        categoryId:
          Number(form.categoryId),
        priorityId:
          Number(form.priorityId),
      })

      showToast('The ticket details were saved.', {
        type: 'success',
        title: 'Ticket updated',
      })

      navigate(`/tickets/${ticketId}`, {
        replace: true,
        state: {
          ticketUpdated: true,
        },
      })
    } catch (requestError) {
      const backendErrors =
        requestError.response?.data?.errors

      if (backendErrors) {
        const firstBackendError =
          Object.values(backendErrors)
            .flat()
            .find(Boolean)

        setSaveError(
          firstBackendError ??
            'The ticket could not be updated.',
        )
      } else {
        setSaveError(
          requestError.response?.data?.message ??
            'Unable to update the ticket. Please try again.',
        )
      }

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } finally {
      setSaving(false)
    }
  }

  function resetChanges() {
    if (!initialForm) {
      return
    }

    setForm(initialForm)
    setErrors({})
    setSaveError('')
  }

  const hasChanges = useMemo(() => {
    if (!initialForm) {
      return false
    }

    return (
      form.title !== initialForm.title ||
      form.categoryId !==
        initialForm.categoryId ||
      form.priorityId !==
        initialForm.priorityId ||
      form.description !==
        initialForm.description
    )
  }, [form, initialForm])

  const selectedPriority =
    priorities.find(
      (priority) =>
        String(priority.id) ===
        form.priorityId,
    )

  if (loading) {
    return (
      <div role="status" aria-label="Loading ticket editor" className="animate-pulse space-y-6">
        <span className="sr-only">Loading ticket editor</span>
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-9 w-72 max-w-full" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-5 sm:grid-cols-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="mt-5 h-44" />
          <div className="mt-6 flex justify-end gap-3">
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-36" />
          </div>
        </section>
      </div>
    )
  }

  if (notFound) {
    return (
      <section className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle size={28} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Ticket not found
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          The ticket does not exist, was deleted,
          or you do not have permission to edit it.
        </p>

        <Link
          to="/tickets"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white"
        >
          <ArrowLeft size={17} />
          Return to tickets
        </Link>
      </section>
    )
  }

  if (pageError || !ticket) {
    return (
      <section className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 text-center">
        <AlertCircle
          size={30}
          className="text-red-600"
        />

        <h1 className="mt-5 text-xl font-bold text-red-900">
          Unable to load ticket
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-red-700">
          {pageError}
        </p>

        <button
          type="button"
          onClick={loadPage}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white"
        >
          <RefreshCw size={17} />
          Try again
        </button>
      </section>
    )
  }

  if (isReadOnlyForEmployee) {
    return (
      <section className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-amber-600">
          <FilePenLine size={28} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-amber-950">
          Ticket is read-only
        </h1>

        <p className="mt-2 max-w-lg text-sm leading-6 text-amber-800">
          This ticket is {ticket.statusName.toLowerCase()}.
          Employees can still view it, but its submitted
          information can no longer be edited.
        </p>

        <Link
          to={`/tickets/${ticketId}`}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-700 px-5 text-sm font-semibold text-white transition hover:bg-amber-800"
        >
          <ArrowLeft size={17} />
          Return to ticket details
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section>
        <Link
          to={`/tickets/${ticketId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to ticket details
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            {ticket.referenceNumber}
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Edit ticket
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Update the information submitted with
            this support request.
          </p>
        </div>
      </section>

      {saveError && (
        <section
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <AlertCircle
            size={21}
            className="mt-0.5 shrink-0 text-red-600"
          />

          <div>
            <p className="text-sm font-bold text-red-800">
              Ticket update failed
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              {saveError}
            </p>
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50"
        >
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FilePenLine size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Ticket information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current status: {ticket.statusName}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="title"
                  className="text-sm font-semibold text-slate-700"
                >
                  Subject{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <span className="text-xs text-slate-400">
                  {form.title.length}/200
                </span>
              </div>

              <input
                id="title"
                name="title"
                type="text"
                maxLength={200}
                value={form.title}
                onChange={handleChange}
                disabled={saving}
                className={[
                  'h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100',
                  errors.title
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100',
                ].join(' ')}
              />

              {errors.title && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="categoryId"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Category{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <select
                  id="categoryId"
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  disabled={saving}
                  className={[
                    'h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-700 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100',
                    errors.categoryId
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100',
                  ].join(' ')}
                >
                  <option value="">
                    Select a category
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

                {errors.categoryId && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {errors.categoryId}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="priorityId"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Priority{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <select
                  id="priorityId"
                  name="priorityId"
                  value={form.priorityId}
                  onChange={handleChange}
                  disabled={saving}
                  className={[
                    'h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-700 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100',
                    errors.priorityId
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100',
                  ].join(' ')}
                >
                  <option value="">
                    Select a priority
                  </option>

                  {priorities.map((priority) => (
                    <option
                      key={priority.id}
                      value={priority.id}
                    >
                      {priority.priorityName}
                    </option>
                  ))}
                </select>

                {errors.priorityId ? (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {errors.priorityId}
                  </p>
                ) : selectedPriority ? (
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          selectedPriority.colorCode,
                      }}
                    />

                    <p className="text-xs text-slate-500">
                      {selectedPriority.priorityName}{' '}
                      priority
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="description"
                  className="text-sm font-semibold text-slate-700"
                >
                  Description{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <span className="text-xs text-slate-400">
                  {form.description.length}/5000
                </span>
              </div>

              <textarea
                id="description"
                name="description"
                rows={11}
                maxLength={5000}
                value={form.description}
                onChange={handleChange}
                disabled={saving}
                className={[
                  'w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100',
                  errors.description
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100',
                ].join(' ')}
              />

              {errors.description && (
                <p className="mt-2 text-sm font-medium text-red-600">
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={resetChanges}
              disabled={!hasChanges || saving}
              className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset changes
            </button>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Link
                to={`/tickets/${ticketId}`}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={!hasChanges || saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {saving ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                {saving
                  ? 'Saving changes...'
                  : 'Save changes'}
              </button>
            </div>
          </div>
        </form>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <Info
                size={20}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <div>
                <h2 className="text-sm font-bold text-blue-900">
                  Editable information
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-700">
                  You can update the subject,
                  category, priority and description.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <h2 className="text-sm font-bold text-amber-900">
                  Workflow fields
                </h2>

                <p className="mt-2 text-sm leading-6 text-amber-700">
                  Status and assigned agent can only
                  be changed by authorised support
                  staff.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
            <h2 className="text-sm font-bold text-slate-900">
              Current ticket
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reference
                </p>

                <p className="mt-1 text-sm font-bold text-blue-600">
                  {ticket.referenceNumber}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </p>

                <span className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {ticket.statusName}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Assigned agent
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {ticket.assignedToName ??
                    'Unassigned'}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default EditTicketPage
