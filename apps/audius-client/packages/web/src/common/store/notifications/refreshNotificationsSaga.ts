import { getErrorMessage, notificationsActions } from '@audius/common'
import moment from 'moment'
import { call, put, takeLatest } from 'typed-redux-saga'

import { NOTIFICATION_LIMIT_DEFAULT } from './constants'
import { fetchNotifications } from './fetchNotifications'
import { parseAndProcessNotifications } from './parseAndProcessNotifications'

const { REFRESH_NOTIFICATIONS } = notificationsActions

const {
  fetchNotificationsRequested,
  setNotifications,
  fetchNotificationsFailed
} = notificationsActions

function* refreshNotifications() {
  yield* put(fetchNotificationsRequested())
  const limit = NOTIFICATION_LIMIT_DEFAULT
  const timeOffset = moment().toISOString()
  const notificationsResponse = yield* call(fetchNotifications, {
    limit,
    timeOffset
  })

  if ('error' in notificationsResponse) {
    yield* put(
      fetchNotificationsFailed(getErrorMessage(notificationsResponse.error))
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
  yield* put(setNotifications(notifications, totalUnviewed, hasMore))
}

export function* watchRefreshNotifications() {
  yield* takeLatest(REFRESH_NOTIFICATIONS, refreshNotifications)
}
