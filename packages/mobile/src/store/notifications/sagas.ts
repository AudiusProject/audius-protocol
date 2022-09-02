import {
  accountSelectors,
  notificationsActions as notificationActions,
  getContext,
  waitForValue
} from '@audius/common'
import { waitForBackendSetup } from 'audius-client/src/common/store/backend/sagas'
import {
  getNotifications,
  getPollingIntervalMs
} from 'audius-client/src/common/store/notifications/sagas'
import { AppState } from 'react-native'
import { call, delay, select, takeEvery } from 'typed-redux-saga'

import PushNotifications from 'app/notifications'

import { ENTER_FOREGROUND } from '../lifecycle/actions'

const getHasAccount = accountSelectors.getHasAccount

// Clear the notification badges if the user is signed in
function* resetNotificationBadgeCount() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  try {
    const hasAccount = yield* select(getHasAccount)
    if (hasAccount) {
      PushNotifications.setBadgeCount(0)
      yield* call(audiusBackendInstance.clearNotificationBadges)
    }
  } catch (error) {
    console.error(error)
  }
}

export function* markedAllNotificationsViewed() {
  PushNotifications.setBadgeCount(0)
}

function* notificationPollingDaemon() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call(waitForBackendSetup)
  yield* call(waitForValue, getHasAccount, {})
  yield* call(audiusBackendInstance.getEmailNotificationSettings)

  yield* takeEvery(ENTER_FOREGROUND, getNotifications, false)

  // Set up daemon that will poll for notifications every 10s if the app is
  // in the foreground
  const isFirstFetch = true

  while (true) {
    if (AppState.currentState === 'active') {
      yield* call(getNotifications, isFirstFetch)
    }
    yield* delay(getPollingIntervalMs(remoteConfigInstance))
  }
}

// On enter foreground, clear the notification badges
function* watchResetNotificationBadgeCount() {
  yield* call(waitForBackendSetup)
  yield* call(resetNotificationBadgeCount)
  yield* takeEvery(ENTER_FOREGROUND, resetNotificationBadgeCount)
}

function* watchMarkedAllNotificationsViewed() {
  yield* takeEvery(
    notificationActions.MARKED_ALL_AS_VIEWED,
    markedAllNotificationsViewed
  )
}

export default function sagas() {
  return [
    watchMarkedAllNotificationsViewed,
    watchResetNotificationBadgeCount,
    notificationPollingDaemon
  ]
}
