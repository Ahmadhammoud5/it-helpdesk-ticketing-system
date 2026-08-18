import { ArrowLeft, Home, LockKeyhole, SearchX } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import helpDeskLogo from '../assets/it-helpdesk-logo.png'
import ThemeToggle from '../components/theme/ThemeToggle'

function ErrorPage({ type = '404' }) {
  const navigate = useNavigate()
  const accessDenied = type === '403'

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-5 py-16 dark:bg-slate-950">
      <ThemeToggle className="absolute right-5 top-5 sm:right-8 sm:top-8" />

      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-10">
        <div className="mx-auto flex items-center justify-center gap-3">
          <span className="relative h-11 w-11 overflow-hidden rounded-xl bg-slate-950">
            <img src={helpDeskLogo} alt="" className="absolute left-[-8px] top-[-40px] w-[190px] max-w-none" />
          </span>
          <span className="text-left">
            <span className="block font-bold text-slate-900 dark:text-white">IT HelpDesk</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">IDS · Internal Support</span>
          </span>
        </div>

        <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          {accessDenied ? <LockKeyhole size={28} /> : <SearchX size={28} />}
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
          {type}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {accessDenied ? 'Access denied' : 'Page not found'}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          {accessDenied
            ? 'You do not have permission to view this page. Your account access has not been changed.'
            : 'The page you requested may have moved or no longer exists.'}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/dashboard" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-500/25">
            <Home size={17} />
            Return to Dashboard
          </Link>
          <button type="button" onClick={() => navigate(-1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-blue-500/20">
            <ArrowLeft size={17} />
            Go back
          </button>
        </div>
      </section>
    </main>
  )
}

export default ErrorPage
