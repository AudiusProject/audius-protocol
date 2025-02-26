import {
  notificationsActions,
  notificationsSelectors,
  FetchNotificationsAction
} from '@audius/common/store'
import { getErrorMessage } from '@audius/common/utils'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { NOTIFICATION_LIMIT_DEFAULT } from './constants'
import { fetchNotifications } from './fetchNotifications'
import { parseAndProcessNotifications } from './parseAndProcessNotifications'

const { getLastNotification } = notificationsSelectors
const {
  fetchNotifications: fetchNotificationsAction,
  fetchNotificationsFailed,
  addNotifications
} = notificationsActions

export function* watchFetchNotifications() {
  yield* takeEvery(fetchNotificationsAction.type, fetchNotificationsSaga)
}

/**
 * Fetch notifications, used by notification pagination
 * This is the function used to fetch more notifcations after the initial load in getNotifications
 */
function* fetchNotificationsSaga(action: FetchNotificationsAction) {
  const pageSize = action.payload?.pageSize ?? NOTIFICATION_LIMIT_DEFAULT
  const lastNotification = yield* select(getLastNotification)
  const timeOffset = lastNotification?.timestamp

  const notificationsResponse = yield* call(fetchNotifications, {
    limit: pageSize,
    timeOffset,
    groupIdOffset: lastNotification?.groupId
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
  const hasMore = notifications.length >= pageSize
  yield* put(addNotifications({ notifications, totalUnviewed, hasMore }))
}
