import { Id } from '@audius/common/models'
import {
  IntKeys,
  remoteConfigIntDefaults,
  RemoteConfigInstance
} from '@audius/common/services'
import {
  notificationsActions,
  accountSelectors,
  getSDK
} from '@audius/common/store'
import { call, takeEvery, select } from 'typed-redux-saga'

import { waitForWrite } from 'utils/sagaHelpers'

import { watchNotificationError } from './errorSagas'
import { watchFetchNotifications } from './fetchNotificationsSaga'
import { watchRefreshNotifications } from './refreshNotificationsSaga'

// The initial user count to load in for each notification
// NOTE: the rest are loading in in the user list modal
export const USER_INITIAL_LOAD_COUNT = 9

// Gets the polling interval from remoteconfig
export const getPollingIntervalMs = (
  remoteConfigInstance: RemoteConfigInstance
) => {
  const pollingInterval = remoteConfigInstance.getRemoteVar(
    IntKeys.NOTIFICATION_POLLING_FREQ_MS
  )
  return (
    pollingInterval ??
    (remoteConfigIntDefaults[IntKeys.NOTIFICATION_POLLING_FREQ_MS] as number)
  )
}

function* watchMarkAllNotificationsViewed() {
  yield* takeEvery(
    notificationsActions.markAllAsViewed.type,
    markAllNotificationsViewed
  )
}

export function* markAllNotificationsViewed() {
  const sdk = yield* getSDK()
  const userId = yield* select(accountSelectors.getUserId)
  if (!userId) return

  yield* call(waitForWrite)
  yield* call(
    [sdk.notifications, sdk.notifications.markAllNotificationsAsViewed],
    {
      userId: Id.parse(userId)
    }
  )
}

export default function sagas() {
  return [
    watchFetchNotifications,
    watchRefreshNotifications,
    watchMarkAllNotificationsViewed,
    watchNotificationError
  ]
}
