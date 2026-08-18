import {
  BellRing,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'

import helpDeskLogo from '../../assets/it-helpdesk-logo.png'
import ThemeToggle from '../theme/ThemeToggle'

const benefits = [
  {
    icon: CheckCircle2,
    title: 'Track every request',
    description: 'Follow progress from submission to resolution.',
  },
  {
    icon: BellRing,
    title: 'Stay informed',
    description: 'Receive timely updates as your ticket changes.',
  },
  {
    icon: ShieldCheck,
    title: 'Work securely',
    description: 'Role-based access keeps support activity protected.',
  },
]

function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={[
          'relative shrink-0 overflow-hidden rounded-2xl bg-slate-950 shadow-lg shadow-blue-950/25',
          compact ? 'h-11 w-11 rounded-xl' : 'h-14 w-14',
        ].join(' ')}
      >
        <img
          src={helpDeskLogo}
          alt=""
          className={[
            'absolute max-w-none select-none',
            compact
              ? 'left-[-8px] top-[-40px] w-[190px]'
              : 'left-[-10px] top-[-51px] w-[240px]',
          ].join(' ')}
        />
      </span>

      <span>
        <span className={compact ? 'block font-bold text-slate-900 dark:text-white' : 'block text-xl font-bold text-white'}>
          IT HelpDesk
        </span>
        <span className={compact ? 'block text-xs text-slate-500 dark:text-slate-400' : 'block text-xs text-blue-100'}>
          IDS · Internal IT Support
        </span>
      </span>
    </div>
  )
}

function AuthLayout({ children, variant = 'login' }) {
  const isRecovery = variant === 'recovery'

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-[minmax(420px,0.95fr)_minmax(500px,1.05fr)]">
      <aside className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-900 px-10 py-9 text-white lg:flex lg:flex-col xl:px-16 xl:py-12">
        <div aria-hidden="true" className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(56,189,248,.4),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,.45),transparent_34%)]" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-px bg-white/15" />

        <div className="relative z-10">
          <BrandMark />
        </div>

        <div className="relative z-10 my-auto max-w-xl py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
            {isRecovery ? 'Secure account recovery' : 'Your support workspace'}
          </p>
          <h1 className="mt-4 max-w-lg text-4xl font-bold leading-[1.12] tracking-tight xl:text-5xl">
            {isRecovery
              ? 'Get back to your HelpDesk account.'
              : 'IT support, organised around your work.'}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-blue-100">
            {isRecovery
              ? 'Request a temporary verification code and choose a new password through a protected recovery flow.'
              : 'Submit requests, collaborate with IT, and keep every update in one dependable place.'}
          </p>

          <div className="mt-9 grid gap-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 backdrop-blur-sm">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-cyan-100">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-blue-100">{description}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-blue-200">
          © 2026 IDS HelpDesk System
        </p>
      </aside>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-20 sm:px-8 lg:px-12 lg:py-10 xl:px-20">
        <ThemeToggle className="absolute right-5 top-5 z-20 shadow-sm sm:right-8 sm:top-8" />

        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <BrandMark compact />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:dark:bg-transparent lg:dark:shadow-none">
            {children}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400 lg:hidden">
            © 2026 IDS HelpDesk System
          </p>
        </div>
      </section>
    </main>
  )
}

export default AuthLayout
