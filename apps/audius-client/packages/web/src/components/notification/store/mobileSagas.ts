import {
  accountSelectors,
  notificationsActions as notificationActions,
  getContext
} from '@audius/common'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import { ResetNotificationsBadgeCount } from 'services/native-mobile-interface/notifications'
import { MessageType } from 'services/native-mobile-interface/types'

const getHasAccount = accountSelectors.getHasAccount

// Clear the notification badges if the user is signed in
function* resetNotificationBadgeCount() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  try {
    const hasAccount = yield* select(getHasAccount)
    if (hasAccount) {
      const message = new ResetNotificationsBadgeCount()
      message.send()
      yield* call(audiusBackendInstance.clearNotificationBadges)
    }
  } catch (error) {
    console.error(error)
  }
}

// On Native App open and enter foreground, clear the notification badges
function* watchResetNotificationBadgeCount() {
  yield* call(waitForBackendSetup)
  yield* call(resetNotificationBadgeCount)
  yield* takeEvery(MessageType.ENTER_FOREGROUND, resetNotificationBadgeCount)
}

function* watchMarkAllNotificationsViewed() {
  yield* takeEvery(MessageType.MARK_ALL_NOTIFICATIONS_AS_VIEWED, function* () {
    yield* put(notificationActions.markAllAsViewed())
  })
}

const sagas = () => {
  return [watchResetNotificationBadgeCount, watchMarkAllNotificationsViewed]
}

export default sagas
