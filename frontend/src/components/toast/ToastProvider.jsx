import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react'

import { ToastContext } from './toastContextValue'

const toastStyles = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-white text-emerald-600 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-emerald-300',
  },
  error: {
    icon: AlertCircle,
    className: 'border-red-200 bg-white text-red-600 dark:border-red-500/30 dark:bg-slate-900 dark:text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-200 bg-white text-amber-600 dark:border-amber-500/30 dark:bg-slate-900 dark:text-amber-300',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-white text-blue-600 dark:border-blue-500/30 dark:bg-slate-900 dark:text-blue-300',
  },
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismissToast = useCallback((id) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id),
    )
  }, [])

  const showToast = useCallback((message, options = {}) => {
    if (!message) {
      return null
    }

    const id = ++nextId.current
    const duration = options.duration ?? 4500
    const toast = {
      id,
      message,
      title: options.title,
      type: options.type ?? 'info',
    }

    setToasts((current) => [...current, toast].slice(-4))

    if (duration > 0) {
      window.setTimeout(() => dismissToast(id), duration)
    }

    return id
  }, [dismissToast])

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setToasts((current) => current.slice(0, -1))
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [dismissToast, showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[200] flex flex-col-reverse items-end gap-3 sm:bottom-auto sm:left-auto sm:right-5 sm:top-5 sm:w-[min(400px,calc(100vw-2.5rem))] sm:flex-col"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] ?? toastStyles.info
          const Icon = style.icon

          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border p-4 shadow-xl shadow-slate-900/10 ${style.className}`}
            >
              <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                {toast.title && (
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{toast.title}</p>
                )}
                <p className={`${toast.title ? 'mt-1' : ''} text-sm leading-5 text-slate-600 dark:text-slate-300`}>
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:hover:bg-slate-800 dark:hover:text-white dark:focus:ring-blue-500/20"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
