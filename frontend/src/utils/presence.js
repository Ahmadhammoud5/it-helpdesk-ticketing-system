export function formatLastSeen(lastSeenUtc) {
  if (!lastSeenUtc) {
    return ''
  }

  const lastSeen = new Date(lastSeenUtc)

  if (Number.isNaN(lastSeen.getTime())) {
    return ''
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - lastSeen.getTime()) / 1000),
  )

  if (elapsedSeconds < 60) {
    return 'just now'
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} min ago`
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60)

  if (elapsedHours < 24) {
    return `${elapsedHours} hr ago`
  }

  if (elapsedHours < 48) {
    return 'yesterday'
  }

  const elapsedDays = Math.floor(elapsedHours / 24)
  return `${elapsedDays} days ago`
}

export function formatPresence({ isOnline, lastSeenUtc }) {
  if (isOnline) {
    return 'Online'
  }

  const lastSeen = formatLastSeen(lastSeenUtc)
  return lastSeen ? `Offline · ${lastSeen}` : 'Offline'
}
