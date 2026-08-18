import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from 'lucide-react'

import { forgotPassword, resetPassword } from '../api/authApi'
import AuthLayout from '../components/auth/AuthLayout'

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

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  disabled,
  placeholder,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          placeholder={placeholder}
          required
          minLength={8}
          disabled={disabled}
          className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/20 dark:disabled:bg-slate-800"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-blue-500/20"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      setMessage(response.message ?? 'If an account exists for this email, a reset code has been sent.')
      setStep('reset')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'The reset request could not be completed.'))
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
      setMessage(response.message ?? 'Password reset successfully.')
      setStep('success')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'The password could not be reset.'))
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

  const heading = step === 'request'
    ? 'Forgot your password?'
    : step === 'reset'
      ? 'Enter your reset code'
      : 'Password updated'

  return (
    <AuthLayout variant="recovery">
      <Link to="/login" className="mb-7 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-500 transition hover:text-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:text-slate-400 dark:hover:text-blue-300 dark:focus:ring-blue-500/20">
        <ArrowLeft size={17} />
        Back to sign in
      </Link>

      <div className="mb-7">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          {step === 'success' ? <CheckCircle2 size={24} /> : <KeyRound size={24} />}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{heading}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {step === 'request' && 'Enter your account email to request a six-digit verification code.'}
          {step === 'reset' && `Use the code sent for ${email} and choose a new password.`}
          {step === 'success' && 'Your password was changed successfully. You can now sign in securely.'}
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/15">
          <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600 dark:text-red-300" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-200">Request failed</p>
            <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {message && step === 'reset' && (
        <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
          {message}
        </div>
      )}

      {step === 'request' && (
        <form className="space-y-5" onSubmit={handleRequestCode} aria-busy={loading}>
          <div>
            <label htmlFor="recovery-email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Email address</label>
            <div className="relative">
              <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError('') }}
                autoComplete="email"
                placeholder="name@company.com"
                required
                autoFocus
                disabled={loading}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/20 dark:disabled:bg-slate-800"
              />
            </div>
          </div>
          <SubmitButton loading={loading} loadingText="Sending code…">Send reset code</SubmitButton>
        </form>
      )}

      {step === 'reset' && (
        <form className="space-y-5" onSubmit={handleResetPassword} aria-busy={loading}>
          <div>
            <label htmlFor="reset-code" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Six-digit reset code</label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(event) => { setCode(event.target.value.replace(/\D/g, '')); setError('') }}
              autoComplete="one-time-code"
              placeholder="000000"
              required
              autoFocus
              disabled={loading}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-center text-lg font-bold tracking-[0.35em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-500/20 dark:disabled:bg-slate-800"
            />
          </div>
          <PasswordField id="newPassword" label="New password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setError('') }} visible={showNewPassword} onToggle={() => setShowNewPassword((current) => !current)} disabled={loading} placeholder="At least 8 characters" />
          <PasswordField id="confirmPassword" label="Confirm new password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError('') }} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((current) => !current)} disabled={loading} placeholder="Enter the password again" />
          <SubmitButton loading={loading} loadingText="Updating password…">Reset password</SubmitButton>
          <button type="button" onClick={restartRequest} disabled={loading} className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-blue-500/20">
            Request another code
          </button>
        </form>
      )}

      {step === 'success' && (
        <div>
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/15">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={21} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
              <div>
                <p className="font-bold text-emerald-800 dark:text-emerald-200">Password reset successfully</p>
                <p className="mt-1 text-sm leading-6 text-emerald-700 dark:text-emerald-300">Your new password is ready to use.</p>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => navigate('/login')} className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-500/25">
            Return to sign in
          </button>
        </div>
      )}
    </AuthLayout>
  )
}

function SubmitButton({ children, loading, loadingText }) {
  return (
    <button type="submit" disabled={loading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-400 dark:focus:ring-blue-500/25">
      {loading && <LoaderCircle size={17} className="animate-spin" />}
      {loading ? loadingText : children}
    </button>
  )
}

export default ForgotPasswordPage
