import { all, call, put, select, takeEvery } from 'redux-saga/effects'

import { getHasAccount } from 'common/store/account/selectors'
import AudiusBackend from 'services/AudiusBackend'
import {
  FetchNotificationsSuccessMessage,
  FetchNotificationsReplaceMessage,
  FetchNotificationsFailureMessage,
  ResetNotificationsBadgeCount
} from 'services/native-mobile-interface/notifications'
import { MessageType } from 'services/native-mobile-interface/types'
import { waitForBackendSetup } from 'store/backend/sagas'

import * as notificationActions from './actions'
import { getNotifications } from './sagas'
import {
  getNotificationEntities,
  getNotificationEntity,
  getNotificationUser,
  getNotificationUsers
} from './selectors'
import { ConnectedNotification, Notification, NotificationType } from './types'

// The maximum number of users to fetch along with a notification,
// which determines the number of profile pictures to show
const USER_LENGTH_LIMIT = 8

// Clear the notification badges if the user is signed in
function* resetNotificationBadgeCount() {
  try {
    const hasAccount = yield select(getHasAccount)
    if (hasAccount) {
      const message = new ResetNotificationsBadgeCount()
      message.send()
      yield call(AudiusBackend.clearNotificationBadges)
    }
  } catch (error) {
    console.error(error)
  }
}

// On Native App open and enter foreground, clear the notification badges
function* watchResetNotificationBadgeCount() {
  yield call(waitForBackendSetup)
  yield call(resetNotificationBadgeCount)
  yield takeEvery(MessageType.ENTER_FOREGROUND, resetNotificationBadgeCount)
}

function* watchFetchNotifications() {
  yield call(waitForBackendSetup)
  yield takeEvery(MessageType.FETCH_NOTIFICATIONS, function* () {
    yield put(notificationActions.fetchNotifications(10))
  })
}

function* watchRefreshNotifications() {
  yield call(waitForBackendSetup)
  yield takeEvery(MessageType.REFRESH_NOTIFICATIONS, function* () {
    yield call(getNotifications, true)
    yield put(
      notificationActions.fetchNotificationSucceeded(
        [], // notifications
        0, // totalUnread
        false // hasMore
      )
    )
  })
}

function* connectNotification(notification: Notification) {
  if (notification.type === NotificationType.Announcement) return notification

  // @ts-ignore
  const connected: ConnectedNotification = { ...notification }
  const user = yield select(getNotificationUser, notification)
  const users = yield select(
    getNotificationUsers,
    notification,
    USER_LENGTH_LIMIT
  )
  if (
    notification.type === NotificationType.RemixCosign ||
    notification.type === NotificationType.RemixCreate
  ) {
    const { twitterHandle } = yield call(
      AudiusBackend.getCreatorSocialHandle,
      user.handle
    )
    user.twitterHandle = twitterHandle || ''
  }
  const entity = yield select(getNotificationEntity, notification)
  const entities = yield select(getNotificationEntities, notification)
  connected.user = user
  connected.users = users
  connected.entity = entity
  connected.entities = entities
  return connected
}

function* connectNotifications(notifications: Notification[]) {
  return yield all(
    notifications.map(notification => connectNotification(notification))
  )
}

function* watchFetchNotificationsSuccess() {
  yield takeEvery(notificationActions.FETCH_NOTIFICATIONS_SUCCEEDED, function* (
    action: notificationActions.FetchNotificationsSucceeded
  ) {
    const connectedNotifications = yield connectNotifications(
      action.notifications
    )
    const message = new FetchNotificationsSuccessMessage(connectedNotifications)
    message.send()
  })
}

function* watchFetchSetNotifications() {
  yield takeEvery(notificationActions.SET_NOTIFICATIONS, function* (
    action: notificationActions.SetNotifications
  ) {
    const connectedNotifications = yield connectNotifications(
      action.notifications
    )
    const message = new FetchNotificationsReplaceMessage(connectedNotifications)
    message.send()
  })
}

function* watchFetchNotificationsFailed() {
  yield takeEvery(notificationActions.FETCH_NOTIFICATIONS_FAILED, function* (
    action
  ) {
    yield new FetchNotificationsFailureMessage().send()
  })
}

function* watchMarkAllNotificationsViewed() {
  yield takeEvery(MessageType.MARK_ALL_NOTIFICATIONS_AS_VIEWED, function* () {
    yield put(notificationActions.markAllAsViewed())
  })
}

const sagas = () => {
  return [
    watchResetNotificationBadgeCount,
    watchFetchNotifications,
    watchFetchNotificationsSuccess,
    watchFetchSetNotifications,
    watchFetchNotificationsFailed,
    watchMarkAllNotificationsViewed,
    watchRefreshNotifications
  ]
}

export default sagas
