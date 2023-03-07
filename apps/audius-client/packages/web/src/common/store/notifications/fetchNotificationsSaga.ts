import {
  FetchNotifications,
  getErrorMessage,
  notificationsActions,
  notificationsSelectors
} from '@audius/common'
import moment from 'moment'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { NOTIFICATION_LIMIT_DEFAULT } from './constants'
import { fetchNotifications } from './fetchNotifications'
import { parseAndProcessNotifications } from './parseAndProcessNotifications'

const { getLastNotification } = notificationsSelectors
const {
  fetchNotificationsRequested,
  fetchNotificationsFailed,
  fetchNotificationSucceeded
} = notificationsActions

export function* watchFetchNotifications() {
  yield* takeEvery(
    notificationsActions.FETCH_NOTIFICATIONS,
    fetchNotificationsSaga
  )
}

/**
 * Fetch notifications, used by notification pagination
 * This is the function used to fetch more notifcations after the initial load in getNotifications
 */
function* fetchNotificationsSaga(action: FetchNotifications) {
  yield* put(fetchNotificationsRequested())
  const limit = action.limit || NOTIFICATION_LIMIT_DEFAULT
  const lastNotification = yield* select(getLastNotification)
  const timeOffset = lastNotification
    ? lastNotification.timestamp
    : moment().toISOString()

  const notificationsResponse = yield* call(fetchNotifications, {
    limit,
    timeOffset,
    groupIdOffset: lastNotification?.groupId
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
  yield* put(fetchNotificationSucceeded(notifications, totalUnviewed, hasMore))
}
