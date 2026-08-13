import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
} from 'react-router'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  Lightbulb,
  LoaderCircle,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'

import {
  createTicket,
  uploadTicketAttachments,
} from '../api/ticketApi'
import {
  getCategories,
  getPriorities,
} from '../api/lookupApi'
import {
  attachmentAccept,
  formatFileSize,
  validateAttachmentFiles,
} from '../utils/ticketAttachments'

const initialForm = {
  title: '',
  categoryId: '',
  priorityId: '',
  description: '',
}

function CreateTicketPage() {
  const navigate = useNavigate()
  const submittingRef = useRef(false)

  const [form, setForm] = useState(initialForm)
  const [categories, setCategories] = useState([])
  const [priorities, setPriorities] = useState([])
  const [selectedFiles, setSelectedFiles] =
    useState([])
  const [attachmentInputKey, setAttachmentInputKey] =
    useState(0)
  const [attachmentError, setAttachmentError] =
    useState('')

  const [errors, setErrors] = useState({})
  const [pageError, setPageError] = useState('')
  const [submitError, setSubmitError] = useState('')

  const [loadingLookups, setLoadingLookups] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  async function loadLookups() {
    setLoadingLookups(true)
    setPageError('')

    try {
      const [
        categoryData,
        priorityData,
      ] = await Promise.all([
        getCategories(),
        getPriorities(),
      ])

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
      setPageError(
        requestError.response?.data?.message ??
          'Unable to load ticket categories and priorities.',
      )
    } finally {
      setLoadingLookups(false)
    }
  }

  useEffect(() => {
    loadLookups()
  }, [])

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

    setSubmitError('')
  }

  function validateForm() {
    const validationErrors = {}

    if (form.title.trim().length < 5) {
      validationErrors.title =
        'Enter a clear title containing at least 5 characters.'
    }

    if (form.title.trim().length > 200) {
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

    if (form.description.trim().length < 10) {
      validationErrors.description =
        'Describe the issue using at least 10 characters.'
    }

    if (form.description.trim().length > 5000) {
      validationErrors.description =
        'The description cannot exceed 5000 characters.'
    }

    return validationErrors
  }

  function handleAttachmentSelection(event) {
    const files = Array.from(
      event.target.files ?? [],
    )
    const validationError =
      validateAttachmentFiles(files)

    setAttachmentError(validationError)

    if (validationError) {
      setSelectedFiles([])
      event.target.value = ''
      return
    }

    setSelectedFiles(files)
    setSubmitError('')
  }

  function removeSelectedFile(indexToRemove) {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter(
        (_, index) => index !== indexToRemove,
      ),
    )
    setAttachmentInputKey(
      (currentKey) => currentKey + 1,
    )
    setAttachmentError('')
  }

  function getAttachmentUploadError(requestError) {
    const status = requestError.response?.status
    const serverMessage =
      requestError.response?.data?.message

    if (
      status >= 400 &&
      status < 500 &&
      serverMessage
    ) {
      return serverMessage
    }

    return 'The selected attachments could not be uploaded. You can try again from the ticket details page.'
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (submittingRef.current) {
      return
    }

    const validationErrors =
      validateForm()
    const fileValidationError =
      validateAttachmentFiles(selectedFiles)

    setAttachmentError(fileValidationError)

    if (
      Object.keys(validationErrors).length > 0 ||
      fileValidationError
    ) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setSubmitError('')
    submittingRef.current = true
    setSubmitting(true)

    try {
      let createdTicket

      try {
        createdTicket = await createTicket({
          title: form.title.trim(),
          description:
            form.description.trim(),
          categoryId:
            Number(form.categoryId),
          priorityId:
            Number(form.priorityId),
        })
      } catch (requestError) {
        const backendErrors =
          requestError.response?.data?.errors

        if (backendErrors) {
          const firstBackendError =
            Object.values(backendErrors)
              .flat()
              .find(Boolean)

          setSubmitError(
            firstBackendError ??
              'The ticket could not be created.',
          )
        } else {
          setSubmitError(
            requestError.response?.data?.message ??
              'Unable to create the ticket. Check the information and try again.',
          )
        }

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })

        return
      }

      let attachmentUploadError = ''

      if (selectedFiles.length > 0) {
        try {
          await uploadTicketAttachments(
            createdTicket.id,
            selectedFiles,
          )
        } catch (requestError) {
          attachmentUploadError =
            getAttachmentUploadError(requestError)
        }
      }

      navigate(
        `/tickets/${createdTicket.id}`,
        {
          replace: true,
          state: {
            ticketCreated: true,
            attachmentUploadError,
          },
        },
      )
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const selectedPriority =
    priorities.find(
      (priority) =>
        String(priority.id) ===
        form.priorityId,
    )

  return (
    <div className="space-y-6">
      <section>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to tickets
        </Link>

        <div className="mt-5">
          <p className="text-sm font-semibold text-blue-600">
            New support request
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Create a new ticket
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Describe the technical issue clearly
            so the IT team can assist you quickly.
          </p>
        </div>
      </section>

      {pageError && (
        <section className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-bold text-red-800">
                Unable to load form
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {pageError}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadLookups}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      )}

      {submitError && (
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
              Ticket creation failed
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              {submitError}
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
                <FileText size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Ticket information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Fields marked with an asterisk
                  are required.
                </p>
              </div>
            </div>
          </div>

          {loadingLookups ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center p-6 text-center">
              <LoaderCircle
                size={30}
                className="animate-spin text-blue-600"
              />

              <p className="mt-4 text-sm font-semibold text-slate-700">
                Loading ticket form...
              </p>
            </div>
          ) : (
            <>
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
                    disabled={
                      submitting ||
                      Boolean(pageError)
                    }
                    placeholder="Example: Wi-Fi disconnects every 10 minutes"
                    className={[
                      'h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100',
                      errors.title
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100',
                    ].join(' ')}
                  />

                  {errors.title ? (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      {errors.title}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Use a short title that clearly
                      summarises the issue.
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
                      disabled={
                        submitting ||
                        Boolean(pageError)
                      }
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

                      {categories.map(
                        (category) => (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {
                              category.categoryName
                            }
                          </option>
                        ),
                      )}
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
                      disabled={
                        submitting ||
                        Boolean(pageError)
                      }
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

                      {priorities.map(
                        (priority) => (
                          <option
                            key={priority.id}
                            value={priority.id}
                          >
                            {
                              priority.priorityName
                            }
                          </option>
                        ),
                      )}
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
                          {
                            selectedPriority.priorityName
                          }{' '}
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
                    rows={10}
                    maxLength={5000}
                    value={form.description}
                    onChange={handleChange}
                    disabled={
                      submitting ||
                      Boolean(pageError)
                    }
                    placeholder="Explain when the issue started, what you were doing, any error messages shown and the steps you already tried."
                    className={[
                      'w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100',
                      errors.description
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100',
                    ].join(' ')}
                  />

                  {errors.description ? (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      {errors.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Do not include passwords,
                      authentication codes or sensitive
                      personal information.
                    </p>
                  )}
                </div>

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Paperclip
                      size={17}
                      className="text-slate-500"
                    />

                    <h3 className="text-sm font-semibold text-slate-700">
                      Attachments
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Add supporting files
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Add screenshots, documents,
                          logs, or other supporting
                          files.
                        </p>
                      </div>

                      <label
                        className={[
                          'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition',
                          submitting
                            ? 'cursor-not-allowed opacity-60'
                            : 'cursor-pointer hover:bg-blue-50',
                        ].join(' ')}
                      >
                        <Paperclip size={16} />
                        Choose files

                        <input
                          key={attachmentInputKey}
                          type="file"
                          multiple
                          accept={attachmentAccept}
                          onChange={
                            handleAttachmentSelection
                          }
                          disabled={submitting}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      PNG, JPG, WEBP, PDF, TXT, DOCX,
                      or XLSX. Maximum 5 files, 10 MB
                      per file, and 50 MB total.
                    </p>

                    {selectedFiles.length > 0 && (
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

                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-slate-700">
                                    {file.name}
                                  </p>

                                  <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                    {formatFileSize(
                                      file.size,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeSelectedFile(
                                    index,
                                  )
                                }
                                disabled={submitting}
                                aria-label={`Remove ${file.name}`}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    <p className="mt-4 text-xs font-medium text-slate-500">
                      {selectedFiles.length === 0
                        ? 'No files selected.'
                        : `${selectedFiles.length} ${
                            selectedFiles.length === 1
                              ? 'file'
                              : 'files'
                          } selected.`}
                    </p>
                  </div>

                  {attachmentError && (
                    <div
                      role="alert"
                      className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                    >
                      <AlertCircle
                        size={17}
                        className="mt-0.5 shrink-0"
                      />
                      {attachmentError}
                    </div>
                  )}
                </section>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <Link
                  to="/tickets"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    Boolean(pageError)
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {submitting ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={17} />
                  )}

                  {submitting
                    ? 'Creating ticket...'
                    : 'Submit ticket'}
                </button>
              </div>
            </>
          )}
        </form>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Lightbulb size={21} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Before you submit
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              A detailed request helps the IT team
              diagnose and resolve the issue faster.
            </p>

            <div className="mt-5 space-y-4">
              {[
                'Restart the application or device.',
                'Check your internet or cable connection.',
                'Include the exact error message.',
                'Explain what changed before the issue started.',
              ].map((tip) => (
                <div
                  key={tip}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />

                  <p className="text-sm leading-5 text-slate-600">
                    {tip}
                  </p>
                </div>
              ))}
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
                  Ticket reference
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-700">
                  A unique reference number will be
                  generated automatically after the
                  ticket is created.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Private and secure
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Only you and authorised support
                  staff can access this request.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default CreateTicketPage
