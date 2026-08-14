import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'

import { getAccessToken } from '../auth/tokenStorage'

const notificationHandlers = new Set()
const presenceHandlers = new Set()
const sessionInvalidatedHandlers = new Set()
const connectionStatusHandlers = new Set()

let connection = null
let startPromise = null
let leaseCount = 0
let pendingStop = null
let retryStart = null
let isRealtimeConnected = false

function publish(handlers, value) {
  handlers.forEach((handler) => handler(value))
}

function setConnectionStatus(isConnected) {
  if (isRealtimeConnected === isConnected) {
    return
  }

  isRealtimeConnected = isConnected
  publish(connectionStatusHandlers, isConnected)
}

function buildConnection() {
  const realtimeConnection = new HubConnectionBuilder()
    .withUrl('/hubs/notifications', {
      accessTokenFactory: () =>
        getAccessToken() ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()

  realtimeConnection.on(
    'notificationReceived',
    (notification) =>
      publish(notificationHandlers, notification),
  )

  realtimeConnection.onreconnecting(() => {
    setConnectionStatus(false)
  })

  realtimeConnection.onreconnected(() => {
    if (retryStart !== null) {
      window.clearTimeout(retryStart)
      retryStart = null
    }

    setConnectionStatus(true)
  })

  realtimeConnection.onclose(() => {
    setConnectionStatus(false)
    scheduleStartRetry()
  })

  realtimeConnection.on(
    'presenceChanged',
    (presence) =>
      publish(presenceHandlers, presence),
  )

  realtimeConnection.on(
    'accountDeactivated',
    () =>
      publish(
        sessionInvalidatedHandlers,
        'Your account has been deactivated.',
      ),
  )

  realtimeConnection.on(
    'sessionInvalidated',
    () =>
      publish(
        sessionInvalidatedHandlers,
        'Your account permissions changed. Please sign in again.',
      ),
  )

  return realtimeConnection
}

function scheduleStartRetry() {
  if (leaseCount === 0 || retryStart !== null) {
    return
  }

  retryStart = window.setTimeout(() => {
    retryStart = null

    startRealtimeConnection().catch(() => {
      // A later retry will keep presence recoverable.
    })
  }, 5000)
}

async function startRealtimeConnection() {
  if (
    !connection ||
    connection.state !== HubConnectionState.Disconnected
  ) {
    return
  }

  if (!startPromise) {
    startPromise = connection.start()
      .finally(() => {
        startPromise = null
      })
  }

  try {
    await startPromise
    setConnectionStatus(
      connection.state === HubConnectionState.Connected,
    )
  } catch (error) {
    setConnectionStatus(false)
    scheduleStartRetry()
    throw error
  }
}

export async function acquireRealtimeConnection() {
  leaseCount += 1

  if (pendingStop !== null) {
    window.clearTimeout(pendingStop)
    pendingStop = null
  }

  connection ??= buildConnection()

  await startRealtimeConnection()
}

export function releaseRealtimeConnection() {
  leaseCount = Math.max(0, leaseCount - 1)

  if (leaseCount > 0 || pendingStop !== null) {
    return
  }

  if (retryStart !== null) {
    window.clearTimeout(retryStart)
    retryStart = null
  }

  pendingStop = window.setTimeout(async () => {
    pendingStop = null

    if (leaseCount > 0 || !connection) {
      return
    }

    try {
      await startPromise
      await connection.stop()
    } catch {
      // The connection may already be stopped after a failed start.
    } finally {
      connection = null
    }
  }, 0)
}

function subscribe(handlers, handler) {
  handlers.add(handler)
  return () => handlers.delete(handler)
}

export function subscribeToNotifications(handler) {
  return subscribe(notificationHandlers, handler)
}

export function subscribeToPresence(handler) {
  return subscribe(presenceHandlers, handler)
}

export function subscribeToSessionInvalidated(handler) {
  return subscribe(sessionInvalidatedHandlers, handler)
}

export function subscribeToRealtimeStatus(handler) {
  handler(isRealtimeConnected)
  return subscribe(connectionStatusHandlers, handler)
}
