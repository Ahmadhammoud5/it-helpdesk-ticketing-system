import { useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router'
import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'

import { useAuth } from '../auth/useAuth'
import AuthLayout from '../components/auth/AuthLayout'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, authLoading, isAuthenticated } = useAuth()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showAccessHelp, setShowAccessHelp] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  function handleChange(event) {
    const { name, value, checked, type } = event.target
    setError('')
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      await signIn(
        {
          email: form.email.trim(),
          password: form.password,
        },
        form.rememberMe,
      )

      navigate(location.state?.from ?? '/dashboard', {
        replace: true,
      })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to sign in. Check your details and try again.',
      )
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          <ShieldCheck size={24} aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">
          Secure account access
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Sign in to manage support requests and continue your work.
        </p>
      </div>

      {location.state?.sessionMessage && (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{location.state.sessionMessage}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/15">
          <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600 dark:text-red-300" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-200">Sign-in failed</p>
            <p id="sign-in-error" className="mt-1 text-sm leading-5 text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit} aria-busy={authLoading}>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Email address
          </label>
          <div className="relative">
            <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="name@company.com"
              required
              autoFocus
              disabled={authLoading}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'sign-in-error' : undefined}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/20 dark:disabled:bg-slate-800"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Password
            </label>
            <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:text-blue-300 dark:hover:text-blue-200 dark:focus:ring-blue-500/20">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              disabled={authLoading}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'sign-in-error' : undefined}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-500/20 dark:disabled:bg-slate-800"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={authLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-blue-500/20"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <input
            name="rememberMe"
            type="checkbox"
            checked={form.rememberMe}
            onChange={handleChange}
            disabled={authLoading}
            className="h-4 w-4 rounded border-slate-300 accent-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed dark:border-slate-600 dark:focus:ring-blue-500/20"
          />
          Keep me signed in
        </label>

        <button type="submit" disabled={authLoading} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-400 dark:focus:ring-blue-500/25">
          {authLoading && <LoaderCircle size={17} className="animate-spin" />}
          {authLoading ? 'Signing in…' : 'Sign in to HelpDesk'}
        </button>
      </form>

      <div className="mt-7 border-t border-slate-200 pt-5 text-center dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Need account access?{' '}
          <button type="button" onClick={() => setShowAccessHelp((current) => !current)} aria-expanded={showAccessHelp} className="font-semibold text-blue-600 transition hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:text-blue-300 dark:hover:text-blue-200 dark:focus:ring-blue-500/20">
            Contact your administrator
          </button>
        </p>
        {showAccessHelp && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left dark:border-blue-500/30 dark:bg-blue-500/15">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">Requesting an account</p>
            <p className="mt-1 text-sm leading-6 text-blue-700 dark:text-blue-300">
              Contact your IT administrator with your full name, work email, and department. Only an authorized administrator can create or activate an account.
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

export default LoginPage
