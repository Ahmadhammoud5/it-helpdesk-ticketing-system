import { useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router'
import {
  Eye,
  EyeOff,
  Headphones,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'

import { useAuth } from '../auth/useAuth'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const {
    signIn,
    authLoading,
    isAuthenticated,
  } = useAuth()

  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showAccessHelp, setShowAccessHelp] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  function handleChange(event) {
    const {
      name,
      value,
      checked,
      type,
    } = event.target

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

      const destination =
        location.state?.from ?? '/dashboard'

      navigate(destination, {
        replace: true,
      })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to sign in. Check that the backend is running and try again.',
      )
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Branding panel */}
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
            <Headphones size={28} />
          </div>

          <h1 className="max-w-lg text-4xl font-bold leading-tight xl:text-5xl">
            Support made simpler, faster and more organised.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-blue-100">
            Submit technical requests, track progress and communicate
            with the IT support team through one secure workspace.
          </p>

          <div className="mt-10 grid max-w-lg gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="font-semibold">
                Track every request
              </p>

              <p className="mt-1 text-sm text-blue-100">
                Follow ticket status and updates in real time.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="font-semibold">
                Secure access
              </p>

              <p className="mt-1 text-sm text-blue-100">
                Protected by JWT authentication and role permissions.
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-blue-200">
          © 2026 IDS HelpDesk System
        </p>
      </section>

      {/* Login panel */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-14">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-sm">
              H
            </div>

            <div>
              <p className="font-bold text-slate-900">
                HelpDesk
              </p>

              <p className="text-xs text-slate-500">
                IDS · Internal IT Support
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck size={25} />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter your account details to access the IT HelpDesk
              system.
            </p>
          </div>

          {location.state?.sessionMessage && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              {location.state.sessionMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
            >
              <p className="text-sm font-semibold text-red-700">
                Sign-in failed
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          <form
            className="space-y-5"
            onSubmit={handleSubmit}
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
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  placeholder="name@company.com"
                  required
                  disabled={authLoading}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

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
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  disabled={authLoading}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
              <input
                name="rememberMe"
                type="checkbox"
                checked={form.rememberMe}
                onChange={handleChange}
                disabled={authLoading}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 disabled:cursor-not-allowed"
              />

              Keep me signed in
            </label>

            <button
              type="submit"
              disabled={authLoading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {authLoading
                ? 'Signing in...'
                : 'Sign in to HelpDesk'}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-sm text-slate-500">
              Need account access?{' '}

              <button
                type="button"
                onClick={() =>
                  setShowAccessHelp((current) => !current)
                }
                aria-expanded={showAccessHelp}
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Contact your system administrator.
              </button>
            </p>

            {showAccessHelp && (
              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-left">
                <p className="text-sm font-semibold text-blue-800">
                  Requesting an account
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-700">
                  Contact your company IT administrator and provide
                  your full name, work email address and department.
                  Only an authorized administrator can create or
                  activate a HelpDesk account.
                </p>

                <button
                  type="button"
                  onClick={() => setShowAccessHelp(false)}
                  className="mt-3 text-sm font-semibold text-blue-700 transition hover:text-blue-900"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400 lg:hidden">
            © 2026 IDS HelpDesk System
          </p>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
