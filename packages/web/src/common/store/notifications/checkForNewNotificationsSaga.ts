import {
  accountSelectors,
  notificationsActions,
  notificationsSelectors,
  NotificationType,
  walletActions,
  getContext,
  Notification
} from '@audius/common/store'
import { Dictionary } from '@reduxjs/toolkit'
import { call, put, select } from 'typed-redux-saga'

import { NOTIFICATION_LIMIT_DEFAULT } from './constants'
import { fetchNotifications } from './fetchNotifications'
import { parseAndProcessNotifications } from './parseAndProcessNotifications'

const { updateNotifications } = notificationsActions
const { selectNotificationEntities } = notificationsSelectors
const { getBalance } = walletActions
const { getHasAccount } = accountSelectors

// Notifications have changed if some of the incoming ones have
// different ids or changed length in unique entities/users
const checkIfNotificationsChanged = (
  current: Dictionary<Notification>,
  incoming: Notification[]
): boolean => {
  return incoming.some((newNotification) => {
    const notification = current[newNotification.id]
    if (!notification) return true

    const isEntitySizeDiff =
      'entityIds' in newNotification &&
      'entityIds' in notification &&
      notification.entityIds &&
      new Set(notification.entityIds).size !==
        new Set(newNotification.entityIds).size

    if (isEntitySizeDiff) return true

    const isUsersSizeDiff =
      'userIds' in newNotification &&
      'userIds' in notification &&
      new Set(notification.userIds).size !==
        new Set(newNotification.userIds).size

    return isUsersSizeDiff
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

  try {
    const notificationsResponse = yield* call(fetchNotifications, {
      limit
    })

    if ('error' in notificationsResponse) {
      throw new Error(
        `Error in notifications response: ${notificationsResponse.error}`
      )
    }

    const { notifications, totalUnviewed } = notificationsResponse
    const currNotifs = yield* select(selectNotificationEntities)

    const hasNewNotifications = checkIfNotificationsChanged(
      currNotifs,
      notifications
    )

    if (hasNewNotifications) {
      const processedNotifications =
        yield* parseAndProcessNotifications(notifications)

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
  } catch (error: Error | unknown) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({ error: error as Error, name: 'Notifications' })
  }
}
