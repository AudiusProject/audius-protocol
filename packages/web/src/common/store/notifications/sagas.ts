import {
  Status,
  IntKeys,
  remoteConfigIntDefaults,
  RemoteConfigInstance,
  getContext,
  notificationsSelectors,
  getErrorMessage,
  notificationsActions as notificationActions,
  FetchNotificationUsers,
  SubscribeUser,
  UnsubscribeUser,
  UpdatePlaylistLastViewedAt
} from '@audius/common'
import { call, fork, put, takeEvery, select } from 'typed-redux-saga'

import { fetchUsers } from 'common/store/cache/users/sagas'
import {
  subscribeToUserAsync,
  unsubscribeFromUserAsync
} from 'common/store/social/users/sagas'
import { waitForWrite } from 'utils/sagaHelpers'

import { watchNotificationError } from './errorSagas'
import { watchFetchNotifications } from './fetchNotificationsSaga'
import { watchRefreshNotifications } from './refreshNotificationsSaga'
const { getNotificationUserList, getNotificationPanelIsOpen } =
  notificationsSelectors

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

export function* fetchNotificationUsers(action: FetchNotificationUsers) {
  try {
    const userList = yield* select(getNotificationUserList)
    if (userList.status === Status.LOADING) return
    yield* put(notificationActions.fetchNotificationUsersRequested())
    const { userIds, limit } = yield* select(getNotificationUserList)
    const newLimit = limit + action.limit
    const userIdsToFetch = userIds.slice(limit, newLimit)
    yield* call(
      fetchUsers,
      userIdsToFetch,
      new Set(),
      /* forceRetrieveFromSource */ true
    )
    yield* put(notificationActions.fetchNotificationUsersSucceeded(newLimit))
  } catch (error) {
    yield* put(
      notificationActions.fetchNotificationUsersFailed(getErrorMessage(error))
    )
  }
}

export function* subscribeUserSettings(action: SubscribeUser) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  yield* call(audiusBackendInstance.updateUserSubscription, action.userId, true)

  // Dual write to discovery. Part of the migration of subscriptions
  // from identity to discovery.
  yield* fork(subscribeToUserAsync, action.userId)
}

export function* unsubscribeUserSettings(action: UnsubscribeUser) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  yield* call(
    audiusBackendInstance.updateUserSubscription,
    action.userId,
    false
  )

  // Dual write to discovery. Part of the migration of subscriptions
  // from identity to discovery.
  yield* fork(unsubscribeFromUserAsync, action.userId)
}

export function* updatePlaylistLastViewedAt(
  action: UpdatePlaylistLastViewedAt
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* call(
    audiusBackendInstance.updatePlaylistLastViewedAt,
    action.playlistId
  )
}

function* watchFetchNotificationUsers() {
  yield* takeEvery(
    notificationActions.FETCH_NOTIFICATIONS_USERS,
    fetchNotificationUsers
  )
}

function* watchMarkAllNotificationsViewed() {
  yield* takeEvery(
    notificationActions.MARK_ALL_AS_VIEWED,
    markAllNotificationsViewed
  )
}

function* watchSubscribeUserSettings() {
  yield* takeEvery(notificationActions.SUBSCRIBE_USER, subscribeUserSettings)
}

function* watchUnsubscribeUserSettings() {
  yield* takeEvery(
    notificationActions.UNSUBSCRIBE_USER,
    unsubscribeUserSettings
  )
}

function* watchUpdatePlaylistLastViewedAt() {
  yield* takeEvery(
    notificationActions.UPDATE_PLAYLIST_VIEW,
    updatePlaylistLastViewedAt
  )
}

export function* markAllNotificationsViewed() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* call(waitForWrite)
  yield* call(audiusBackendInstance.markAllNotificationAsViewed)
  yield* put(notificationActions.markedAllAsViewed())
}

function* watchTogglePanel() {
  yield* call(waitForWrite)
  yield* takeEvery(notificationActions.TOGGLE_NOTIFICATION_PANEL, function* () {
    const isOpen = yield* select(getNotificationPanelIsOpen)
    if (isOpen) {
      yield* put(notificationActions.setTotalUnviewedToZero())
    } else {
      yield* put(notificationActions.markAllAsViewed())
    }
  })
}

export default function sagas() {
  return [
    watchFetchNotifications,
    watchRefreshNotifications,
    watchFetchNotificationUsers,
    watchMarkAllNotificationsViewed,
    watchSubscribeUserSettings,
    watchUnsubscribeUserSettings,
    watchTogglePanel,
    watchNotificationError,
    watchUpdatePlaylistLastViewedAt
  ]
}
