import {
  accountSelectors,
  notificationsActions,
  getContext,
  getSDK
} from '@audius/common/store'
import commonNotificationsSagas from '@audius/web/src/common/store/notifications/sagas'
import { waitForWrite } from '@audius/web/src/utils/sagaHelpers'
import { call, select, takeEvery } from 'typed-redux-saga'

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
      const sdk = yield* getSDK()
      yield* call(audiusBackendInstance.clearNotificationBadges, { sdk })
    }
  } catch (error) {
    console.error(error)
  }
}

export function* markedAllNotificationsViewed() {
  PushNotifications.setBadgeCount(0)
}

// On enter foreground, clear the notification badges
function* watchResetNotificationBadgeCount() {
  yield* call(waitForWrite)
  yield* call(resetNotificationBadgeCount)
  yield* takeEvery(ENTER_FOREGROUND, resetNotificationBadgeCount)
}

function* watchMarkedAllNotificationsViewed() {
  yield* takeEvery(
    notificationsActions.markAllAsViewed.type,
    markedAllNotificationsViewed
  )
}

export default function sagas() {
  return [
    ...commonNotificationsSagas(),
    watchMarkedAllNotificationsViewed,
    watchResetNotificationBadgeCount
  ]
}
