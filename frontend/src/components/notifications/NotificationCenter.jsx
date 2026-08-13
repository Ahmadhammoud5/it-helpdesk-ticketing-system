import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  CheckCheck,
  LoaderCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router'

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../api/notificationApi'

import {
  createNotificationHubConnection,
} from '../../api/notificationHub'

function formatNotificationDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString()
}

function NotificationCenter() {
  const navigate = useNavigate()

  const containerRef = useRef(null)
  const notificationIdsRef = useRef(new Set())

  const [notifications, setNotifications] =
    useState([])

  const [unreadCount, setUnreadCount] =
    useState(0)

  const [isOpen, setIsOpen] =
    useState(false)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isMarkingAll, setIsMarkingAll] =
    useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    let active = true
    let connection = null

    async function initializeNotifications() {
      try {
        setIsLoading(true)
        setError('')

        const result =
          await getNotifications()

        if (!active) {
          return
        }

        const loadedNotifications =
          Array.isArray(result.notifications)
            ? result.notifications
            : []

        notificationIdsRef.current = new Set(
          loadedNotifications.map(
            (notification) => notification.id,
          ),
        )

        setNotifications(loadedNotifications)

        setUnreadCount(
          Number.isFinite(result.unreadCount)
            ? result.unreadCount
            : 0,
        )
      } catch {
        if (active) {
          setError(
            'Unable to load notifications.',
          )
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }

      connection =
        createNotificationHubConnection(
          (notification) => {
            if (!active) {
              return
            }

            const isNewNotification =
              !notificationIdsRef.current.has(
                notification.id,
              )

            notificationIdsRef.current.add(
              notification.id,
            )

            setNotifications(
              (currentNotifications) => {
                const withoutDuplicate =
                  currentNotifications.filter(
                    (item) =>
                      item.id !== notification.id,
                  )

                return [
                  notification,
                  ...withoutDuplicate,
                ].slice(0, 50)
              },
            )

            if (
              isNewNotification &&
              !notification.isRead
            ) {
              setUnreadCount(
                (currentCount) =>
                  currentCount + 1,
              )
            }
          },
        )

      try {
        await connection.start()
      } catch (connectionError) {
        console.error(
          'Notification SignalR connection failed.',
          connectionError,
        )
      }
    }

    initializeNotifications()

    return () => {
      active = false

      if (connection) {
        connection.stop().catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target,
        )
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    )
    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      )
      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [])

  async function handleNotificationClick(
    notification,
  ) {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(
          notification.id,
        )

        setNotifications(
          (currentNotifications) =>
            currentNotifications.map((item) =>
              item.id === notification.id
                ? {
                    ...item,
                    isRead: true,
                    readDate:
                      new Date().toISOString(),
                  }
                : item,
            ),
        )

        setUnreadCount(
          (currentCount) =>
            Math.max(0, currentCount - 1),
        )
      }

      setIsOpen(false)

      if (notification.ticketId) {
        navigate(
          `/tickets/${notification.ticketId}`,
        )
      }
    } catch {
      setError(
        'Unable to update the notification.',
      )
    }
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) {
      return
    }

    try {
      setIsMarkingAll(true)
      setError('')

      await markAllNotificationsAsRead()

      const readDate =
        new Date().toISOString()

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) => ({
              ...notification,
              isRead: true,
              readDate:
                notification.readDate ??
                readDate,
            }),
          ),
      )

      setUnreadCount(0)
    } catch {
      setError(
        'Unable to mark notifications as read.',
      )
    } finally {
      setIsMarkingAll(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        aria-label={
          unreadCount === 0
            ? 'Notifications'
            : `Notifications, ${unreadCount} unread`
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Notifications"
      >
        <Bell size={18} />

        {unreadCount > 0 && (
          <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 99
              ? '99+'
              : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div>
              <h2 className="font-bold text-slate-900">
                Notifications
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount === 0
                  ? 'You are all caught up.'
                  : `${unreadCount} unread notification${
                      unreadCount === 1
                        ? ''
                        : 's'
                    }`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={
                unreadCount === 0 ||
                isMarkingAll
              }
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              {isMarkingAll ? (
                <LoaderCircle
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <CheckCheck size={15} />
              )}

              Mark all read
            </button>
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="max-h-[430px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <LoaderCircle
                  size={24}
                  className="animate-spin"
                />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Bell size={20} />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No notifications yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  New ticket activity will
                  appear here.
                </p>
              </div>
            ) : (
              notifications.map(
                (notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      handleNotificationClick(
                        notification,
                      )
                    }
                    className={[
                      'flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0',
                      notification.isRead
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-blue-50/70 hover:bg-blue-50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                        notification.isRead
                          ? 'bg-slate-200'
                          : 'bg-blue-500',
                      ].join(' ')}
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-800">
                        {notification.title}
                      </span>

                      <span className="mt-1 block text-sm leading-5 text-slate-600">
                        {notification.message}
                      </span>

                      <span className="mt-2 block text-[11px] font-medium text-slate-400">
                        {formatNotificationDate(
                          notification.createdDate,
                        )}
                      </span>
                    </span>
                  </button>
                ),
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
