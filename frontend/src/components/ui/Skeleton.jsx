function Skeleton({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  )
}

export default Skeleton
