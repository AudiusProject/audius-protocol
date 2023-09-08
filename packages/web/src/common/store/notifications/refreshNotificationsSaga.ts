import { getErrorMessage, notificationsActions } from '@audius/common'
import { call, put, takeLatest } from 'typed-redux-saga'

import { NOTIFICATION_LIMIT_DEFAULT } from './constants'
import { fetchNotifications } from './fetchNotifications'
import { parseAndProcessNotifications } from './parseAndProcessNotifications'

const { updateNotifications, fetchNotificationsFailed, refreshNotifications } =
  notificationsActions

function* refreshNotificationsWorker() {
  const limit = NOTIFICATION_LIMIT_DEFAULT
  const notificationsResponse = yield* call(fetchNotifications, {
    limit
  })

  if ('error' in notificationsResponse) {
    yield* put(
      fetchNotificationsFailed({
        message: getErrorMessage(notificationsResponse.error)
      })
    )
    return
  }

  const { notifications: notificationItems, totalUnviewed } =
    notificationsResponse

  const notifications = yield* call(
    parseAndProcessNotifications,
    notificationItems
  )

  const hasMore = notifications.length >= limit
  yield* put(updateNotifications({ notifications, totalUnviewed, hasMore }))
}

export function* watchRefreshNotifications() {
  yield* takeLatest(refreshNotifications.type, refreshNotificationsWorker)
}
