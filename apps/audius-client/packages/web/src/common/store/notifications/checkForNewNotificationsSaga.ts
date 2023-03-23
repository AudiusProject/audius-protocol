import {
  accountSelectors,
  Notification,
  notificationsActions,
  notificationsSelectors,
  NotificationType,
  walletActions
} from '@audius/common'
import { call, put, select } from 'typed-redux-saga'

import { NOTIFICATION_LIMIT_DEFAULT } from './constants'
import { fetchNotifications } from './fetchNotifications'
import { parseAndProcessNotifications } from './parseAndProcessNotifications'

const { updateNotifications } = notificationsActions
const { makeGetAllNotifications } = notificationsSelectors
const getAllNotifications = makeGetAllNotifications()
const { getBalance } = walletActions
const { getHasAccount } = accountSelectors

// Notifications have changed if some of the incoming ones have
// different ids or changed length in unique entities/users
const checkIfNotificationsChanged = (
  current: Notification[],
  incoming: Notification[]
): boolean => {
  return incoming.some((newNotification, index: number) => {
    const notification = current[index]
    if (!notification) return true
    const isIdDifferent = notification.id !== newNotification.id

    const isEntitySizeDiff =
      'entityIds' in newNotification &&
      'entityIds' in notification &&
      notification.entityIds &&
      new Set(notification.entityIds).size !==
        new Set(newNotification.entityIds).size

    const isUsersSizeDiff =
      'userIds' in newNotification &&
      'userIds' in notification &&
      new Set(notification.userIds).size !==
        new Set(newNotification.userIds).size

    return isIdDifferent || isEntitySizeDiff || isUsersSizeDiff
  })
}

/**
 * Run side effects for new notifications
 */
const AUDIO_TRANSFER_NOTIFICATION_TYPES = new Set([
  NotificationType.ChallengeReward,
  NotificationType.TipSend,
  NotificationType.TipReceive
])
export function* handleNewNotifications(notifications: Notification[]) {
  const hasAudioTransferNotification = notifications.some((notification) =>
    AUDIO_TRANSFER_NOTIFICATION_TYPES.has(notification.type)
  )
  if (hasAudioTransferNotification) {
    yield* put(getBalance())
  }
}

export function* checkForNewNotificationsSaga() {
  const hasAccount = yield* select(getHasAccount)
  if (!hasAccount) return

  const limit = NOTIFICATION_LIMIT_DEFAULT

  const notificationsResponse = yield* call(fetchNotifications, {
    limit
  })

  if ('error' in notificationsResponse) {
    return
  }

  const { notifications, totalUnviewed } = notificationsResponse
  const currentNotifications = yield* select(getAllNotifications)

  const hasNewNotifications = checkIfNotificationsChanged(
    currentNotifications,
    notifications
  )

  if (hasNewNotifications) {
    const processedNotifications = yield* parseAndProcessNotifications(
      notifications
    )

    const hasMore = notifications.length >= limit

    yield* put(
      updateNotifications({
        notifications: processedNotifications,
        totalUnviewed,
        hasMore
      })
    )
    yield* handleNewNotifications(notifications)
  }
}
