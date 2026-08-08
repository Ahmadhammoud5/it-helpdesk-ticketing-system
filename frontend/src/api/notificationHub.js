import {
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr'

import { getAccessToken } from '../auth/tokenStorage'

export function createNotificationHubConnection(
  onNotificationReceived,
) {
  const connection = new HubConnectionBuilder()
    .withUrl('/hubs/notifications', {
      accessTokenFactory: () =>
        getAccessToken() ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()

  connection.on(
    'notificationReceived',
    (notification) => {
      onNotificationReceived?.(notification)
    },
  )

  return connection
}