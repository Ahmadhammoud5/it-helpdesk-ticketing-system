import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'

import {
  forgotPassword,
  resetPassword,
} from '../api/authApi'
import ThemeToggle from '../components/theme/ThemeToggle'

function getErrorMessage(error, fallbackMessage) {
  const responseData = error.response?.data

  if (responseData?.message) {
    return responseData.message
  }

  if (responseData?.errors) {
    const validationErrors = Object.values(responseData.errors)
      .flat()
      .filter(Boolean)

    if (validationErrors.length > 0) {
      return validationErrors.join(' ')
    }
  }

  return fallbackMessage
}

function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleRequestCode(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      setError('Enter your email address.')
      return
    }

    try {
      setLoading(true)

      const response = await forgotPassword(normalizedEmail)

      setEmail(normalizedEmail)
      setMessage(
        response.message ??
          'If an account exists for this email, a reset code has been sent.',
      )
      setStep('reset')
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'The reset request could not be completed.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!/^\d{6}$/.test(code.trim())) {
      setError('The reset code must contain exactly six digits.')
      return
    }

    if (newPassword.length < 8) {
      setError('The new password must contain at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('The password confirmation does not match.')
      return
    }

    try {
      setLoading(true)

      const response = await resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
        confirmPassword,
      })

      setMessage(
        response.message ?? 'Password reset successfully.',
      )
      setStep('success')
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'The password could not be reset.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  function restartRequest() {
    setStep('request')
    setCode('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setMessage('')
  }

  return (
    <main className="relative min-h-screen bg-slate-50 transition-colors dark:bg-slate-950 lg:grid lg:grid-cols-2">
      <ThemeToggle className="absolute right-5 top-5 z-20 shadow-sm sm:right-8 sm:top-8" />

      <section className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-bold text-blue-700 shadow-lg shadow-blue-950/20">
            H
          </div>

          <div>
            <p className="text-lg font-bold">
              HelpDesk
            </p>

            <p className="text-xs text-blue-100">
              IDS · Internal IT Support
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <KeyRound size={28} />
          </div>

          <h1 className="max-w-lg text-4xl font-bold leading-tight xl:text-5xl">
            Recover your account securely.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-blue-100">
            Request a temporary verification code and choose a new
            password for your HelpDesk account.
          </p>

          <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={22}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold">
                  Protected recovery process
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-100">
                  Reset codes are temporary and can only be used once.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-blue-200">
          © 2026 IDS HelpDesk System
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-20 sm:px-8 lg:px-14 lg:py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link
              to="/login"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={17} />
              Back to sign in
            </Link>

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              {step === 'success' ? (
                <CheckCircle2 size={25} />
              ) : (
                <KeyRound size={25} />
              )}
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              {step === 'request' && 'Forgot your password?'}
              {step === 'reset' && 'Enter your reset code'}
              {step === 'success' && 'Password updated'}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {step === 'request' &&
                'Enter your account email to request a six-digit reset code.'}

              {step === 'reset' &&
                `Enter the code sent for ${email} and choose a new password.`}

              {step === 'success' &&
                'Your password was changed successfully. You can now sign in using the new password.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
            >
              <p className="text-sm font-semibold text-red-700">
                Request failed
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {message && step !== 'success' && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm font-semibold text-green-700">
                Check your email
              </p>

              <p className="mt-1 text-sm text-green-600">
                {message}
              </p>
            </div>
          )}

          {step === 'request' && (
            <form
              className="space-y-5"
              onSubmit={handleRequestCode}
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setError('')
                    }}
                    autoComplete="email"
                    placeholder="name@company.com"
                    required
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {loading
                  ? 'Sending code...'
                  : 'Send reset code'}
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form
              className="space-y-5"
              onSubmit={handleResetPassword}
            >
              <div>
                <label
                  htmlFor="code"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Six-digit reset code
                </label>

                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) => {
                    const numericValue = event.target.value.replace(
                      /\D/g,
                      '',
                    )

                    setCode(numericValue)
                    setError('')
                  }}
                  autoComplete="one-time-code"
                  placeholder="000000"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-center text-lg font-semibold tracking-[0.35em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  New password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value)
                      setError('')
                    }}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword((current) => !current)
                    }
                    disabled={loading}
                    aria-label={
                      showNewPassword
                        ? 'Hide new password'
                        : 'Show new password'
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed"
                  >
                    {showNewPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm new password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword ? 'text' : 'password'
                    }
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      setError('')
                    }}
                    autoComplete="new-password"
                    placeholder="Enter the password again"
                    required
                    minLength={8}
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    disabled={loading}
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirmed password'
                        : 'Show confirmed password'
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {loading
                  ? 'Updating password...'
                  : 'Reset password'}
              </button>

              <button
                type="button"
                onClick={restartRequest}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                Request another code
              </button>
            </form>
          )}

          {step === 'success' && (
            <div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={22}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <div>
                    <p className="font-semibold text-green-800">
                      Password reset successfully
                    </p>

                    <p className="mt-1 text-sm leading-6 text-green-700">
                      Your new password is ready to use.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                Return to sign in
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default ForgotPasswordPage
