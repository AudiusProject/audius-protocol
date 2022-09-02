import {
  ID,
  Name,
  Status,
  Track,
  FeatureFlags,
  IntKeys,
  remoteConfigIntDefaults,
  RemoteConfigInstance,
  accountSelectors,
  getContext,
  notificationsSelectors,
  Notification,
  getErrorMessage,
  Entity,
  NotificationType,
  Achievement,
  notificationsActions as notificationActions,
  FetchNotificationUsers,
  FetchNotifications,
  SubscribeUser,
  UnsubscribeUser,
  UpdatePlaylistLastViewedAt,
  reachabilitySelectors,
  walletActions,
  reactionsUIActions,
  waitForAccount,
  Remix
} from '@audius/common'
import moment from 'moment'
import {
  call,
  delay,
  fork,
  all,
  put,
  takeEvery,
  select,
  takeLatest
} from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { waitForBackendSetup } from 'common/store/backend/sagas'
import { retrieveCollections } from 'common/store/cache/collections/utils'
import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { fetchUsers } from 'common/store/cache/users/sagas'

import { watchNotificationError } from './errorSagas'
const { fetchReactionValues } = reactionsUIActions
const { getBalance } = walletActions
const { getIsReachable } = reachabilitySelectors
const {
  getLastNotification,
  getNotificationUserList,
  getNotificationPanelIsOpen,
  getNotificationStatus,
  makeGetAllNotifications,
  getPlaylistUpdates
} = notificationsSelectors
const { getUserId, getHasAccount } = accountSelectors

type ResponseNotification = Notification & {
  id: string
  entityIds: number[]
  userIds: number[]
}

type NotificationsResponse =
  | {
      notifications: ResponseNotification[]
      totalUnread: number
      playlistUpdates: number[]
    }
  | {
      error: { message: string }
      isRequestError: true
    }

// The initial user count to load in for each notification
// NOTE: the rest are loading in in the user list modal
export const USER_INITIAL_LOAD_COUNT = 9

const getTimeAgo = (now: moment.Moment, date: string) => {
  const notifDate = moment(date)
  const weeksAgo = now.diff(notifDate, 'weeks')
  if (weeksAgo) return `${weeksAgo} Week${weeksAgo > 1 ? 's' : ''} ago`
  const daysAgo = now.diff(notifDate, 'days')
  if (daysAgo) return `${daysAgo} Day${daysAgo > 1 ? 's' : ''} ago`
  const hoursAgo = now.diff(notifDate, 'hours')
  if (hoursAgo) return `${hoursAgo} Hour${hoursAgo > 1 ? 's' : ''} ago`
  const minutesAgo = now.diff(notifDate, 'minutes')
  if (minutesAgo) return `${minutesAgo} Minute${minutesAgo > 1 ? 's' : ''} ago`
  return 'A few moments ago'
}

const NOTIFICATION_LIMIT_DEFAULT = 20

function* recordPlaylistUpdatesAnalytics(playlistUpdates: ID[]) {
  const existingUpdates: ID[] = yield* select(getPlaylistUpdates)
  if (
    playlistUpdates.length > 0 &&
    existingUpdates.length !== playlistUpdates.length
  ) {
    yield* put(notificationActions.setPlaylistUpdates(playlistUpdates))
    const event = make(Name.PLAYLIST_LIBRARY_HAS_UPDATE, {
      count: playlistUpdates.length
    })
    yield* put(event)
  }
}

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

/**
 * Fetch notifications, used by notification pagination
 * This is the function used to fetch more notifcations after the initial load in getNotifications
 */
export function* fetchNotifications(action: FetchNotifications) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  try {
    yield* put(notificationActions.fetchNotificationsRequested())
    const limit = action.limit || NOTIFICATION_LIMIT_DEFAULT
    const lastNotification = yield* select(getLastNotification)
    const timeOffset = lastNotification
      ? lastNotification.timestamp
      : moment().toISOString()
    const withDethroned =
      ((yield* call(
        getFeatureEnabled,
        FeatureFlags.SUPPORTER_DETHRONED_ENABLED
      )) as boolean | null) ?? false

    const notificationsResponse: NotificationsResponse = yield* call(() =>
      audiusBackendInstance.getNotifications({
        limit,
        timeOffset,
        withDethroned
      })
    )
    if ('error' in notificationsResponse) {
      yield* put(
        notificationActions.fetchNotificationsFailed(
          notificationsResponse.error.message
        )
      )
      return
    }
    const {
      notifications: notificationItems,
      totalUnread: totalUnviewed,
      playlistUpdates
    } = notificationsResponse

    const notifications = yield* parseAndProcessNotifications(notificationItems)

    const hasMore = notifications.length >= limit

    yield* fork(recordPlaylistUpdatesAnalytics, playlistUpdates)
    yield* put(
      notificationActions.fetchNotificationSucceeded(
        notifications,
        totalUnviewed,
        hasMore
      )
    )
  } catch (error) {
    const isReachable = yield* select(getIsReachable)
    if (isReachable) {
      yield* put(
        notificationActions.fetchNotificationsFailed(
          `Error in fetch notifications requested: ${getErrorMessage(error)}`
        )
      )
    }
  }
}

export function* parseAndProcessNotifications(
  notifications: Notification[]
): Generator<any, Notification[], any> {
  /**
   * Parse through the notifications & collect user /track / collection IDs
   * that the notification references to fetch
   */
  const trackIdsToFetch: ID[] = []
  const collectionIdsToFetch: ID[] = []
  const userIdsToFetch: ID[] = []
  const reactionSignatureToFetch: string[] = []

  notifications.forEach((notification) => {
    if (notification.type === NotificationType.UserSubscription) {
      if (notification.entityType === Entity.Track) {
        // @ts-ignore
        notification.entityIds = [...new Set(notification.entityIds)]
        trackIdsToFetch.push(...notification.entityIds)
      } else if (
        notification.entityType === Entity.Playlist ||
        notification.entityType === Entity.Album
      ) {
        // @ts-ignore
        notification.entityIds = [...new Set(notification.entityIds)]
        collectionIdsToFetch.push(...notification.entityIds)
      }
      userIdsToFetch.push(notification.userId)
    }
    if (
      notification.type === NotificationType.Repost ||
      notification.type === NotificationType.Favorite ||
      (notification.type === NotificationType.Milestone &&
        'entityType' in notification)
    ) {
      if (notification.entityType === Entity.Track) {
        trackIdsToFetch.push(notification.entityId)
      } else if (
        notification.entityType === Entity.Playlist ||
        notification.entityType === Entity.Album
      ) {
        collectionIdsToFetch.push(notification.entityId)
      } else if (notification.entityType === Entity.User) {
        userIdsToFetch.push(notification.entityId)
      }
    }
    if (
      notification.type === NotificationType.Follow ||
      notification.type === NotificationType.Repost ||
      notification.type === NotificationType.Favorite
    ) {
      // @ts-ignore
      notification.userIds = [...new Set(notification.userIds)]
      userIdsToFetch.push(
        ...notification.userIds.slice(0, USER_INITIAL_LOAD_COUNT)
      )
    }
    if (notification.type === NotificationType.RemixCreate) {
      trackIdsToFetch.push(
        notification.parentTrackId,
        notification.childTrackId
      )
      notification.entityType = Entity.Track
      notification.entityIds = [
        notification.parentTrackId,
        notification.childTrackId
      ]
    }
    if (notification.type === NotificationType.RemixCosign) {
      trackIdsToFetch.push(notification.childTrackId)
      userIdsToFetch.push(notification.parentTrackUserId)
      notification.entityType = Entity.Track
      notification.entityIds = [notification.childTrackId]
      notification.userId = notification.parentTrackUserId
    }
    if (notification.type === NotificationType.TrendingTrack) {
      trackIdsToFetch.push(notification.entityId)
    }
    if (
      notification.type === NotificationType.TipSend ||
      notification.type === NotificationType.TipReceive ||
      notification.type === NotificationType.SupporterRankUp ||
      notification.type === NotificationType.SupportingRankUp ||
      notification.type === NotificationType.Reaction
    ) {
      userIdsToFetch.push(notification.entityId)
    }
    if (notification.type === NotificationType.TipReceive) {
      reactionSignatureToFetch.push(notification.tipTxSignature)
    }
    if (notification.type === NotificationType.AddTrackToPlaylist) {
      trackIdsToFetch.push(notification.trackId)
      userIdsToFetch.push(notification.playlistOwnerId)
      collectionIdsToFetch.push(notification.playlistId)
    }
    if (notification.type === NotificationType.SupporterDethroned) {
      userIdsToFetch.push(notification.supportedUserId)
      userIdsToFetch.push(notification.entityId)
    }
  })

  const [tracks] = yield* all([
    call(retrieveTracks, { trackIds: trackIdsToFetch }),
    call(
      retrieveCollections,
      null, // userId
      collectionIdsToFetch, // collection ids
      false // fetchTracks
    ),
    call(
      fetchUsers,
      userIdsToFetch, // userIds
      undefined, // requiredFields
      false // forceRetrieveFromSource
    ),
    reactionSignatureToFetch.length
      ? put(fetchReactionValues({ entityIds: reactionSignatureToFetch }))
      : () => {}
  ])

  /**
   * For Milestone and Followers, update the notification entityId as the userId
   * For Remix Create, add the userId as the track owner id of the fetched child track
   * Attach a `timeLabel` to each notification as well to be displayed ie. 2 Hours Ago
   */
  const now = moment()
  yield* waitForAccount()
  const userId = yield* select(getUserId)
  if (!userId) return []
  const remixTrackParents: Array<ID> = []
  const processedNotifications = notifications.map((notif) => {
    if (
      notif.type === NotificationType.Milestone &&
      notif.achievement === Achievement.Followers
    ) {
      notif.entityId = userId
    } else if (notif.type === NotificationType.RemixCreate) {
      const childTrack = (tracks as Track[]).find(
        (track) => track.track_id === notif.childTrackId
      )
      if (childTrack) {
        notif.userId = childTrack.owner_id
      }
    } else if (notif.type === NotificationType.RemixCosign) {
      const childTrack = (tracks as Track[]).find(
        (track) => track.track_id === notif.childTrackId
      )
      if (childTrack && childTrack.remix_of) {
        const parentTrackIds = childTrack.remix_of.tracks.map(
          (t: Remix) => t.parent_track_id
        )
        remixTrackParents.push(...parentTrackIds)
        notif.entityIds.push(...parentTrackIds)
      }
    }
    notif.timeLabel = getTimeAgo(now, notif.timestamp)
    return notif
  })
  if (remixTrackParents.length > 0)
    yield* call(retrieveTracks, { trackIds: remixTrackParents })
  return processedNotifications
}

/**
 * Run side effects for new notifications
 */
const AUDIO_TRANSFER_NOTIFICATION_TYPES = new Set([
  NotificationType.ChallengeReward,
  NotificationType.TipSend,
  NotificationType.TipReceive
])
export function* handleNewNotifications(notifications: Notification[]) {
  const hasAudioTransferNotification = notifications.some((notification) =>
    AUDIO_TRANSFER_NOTIFICATION_TYPES.has(notification.type)
  )
  if (hasAudioTransferNotification) {
    yield* put(getBalance())
  }
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
}

export function* unsubscribeUserSettings(action: UnsubscribeUser) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* call(
    audiusBackendInstance.updateUserSubscription,
    action.userId,
    false
  )
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

// Action Watchers
function* watchFetchNotifications() {
  yield* takeEvery(notificationActions.FETCH_NOTIFICATIONS, fetchNotifications)
}

function* watchRefreshNotifications() {
  yield* takeLatest(notificationActions.REFRESH_NOTIFICATIONS, function* () {
    yield* put(notificationActions.fetchNotificationsRequested())
    // Add an artificial timeout here for the sake of debouncing the sync to
    // react native store. Currently this refresh saga should only be called by
    // notifications on mobile.
    // TODO: This should be removed when we move common store to react native
    yield* delay(1000)
    yield* call(getNotifications, true)
    yield* put(
      notificationActions.fetchNotificationSucceeded(
        [], // notifications
        0, // totalUnviewed
        false // hasMore
      )
    )
  })
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

// Notifications have changed if some of the incoming ones have
// different ids or changed length in unique entities/users
const checkIfNotificationsChanged = (
  current: Notification[],
  incoming: ResponseNotification[]
): boolean => {
  return (
    incoming.length > current.length ||
    incoming.some((item: any, index: number) => {
      const notif = current[index]
      const isIdDifferent = notif.id !== item.id
      const isEntitySizeDiff =
        'entityIds' in notif &&
        notif.entityIds &&
        item.entityIds &&
        new Set(notif.entityIds).size !== new Set(item.entityIds).size
      const isUsersSizeDiff =
        'userIds' in notif &&
        notif.userIds &&
        item.userIds &&
        new Set(notif.userIds).size !== new Set(item.userIds).size
      return isIdDifferent || isEntitySizeDiff || isUsersSizeDiff
    })
  )
}

/**
 * Get notifications, used the polling daemon
 */
export function* getNotifications(isFirstFetch: boolean) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  try {
    const isOpen: ReturnType<typeof getNotificationPanelIsOpen> = yield* select(
      getNotificationPanelIsOpen
    )
    const status: ReturnType<typeof getNotificationStatus> = yield* select(
      getNotificationStatus
    )
    if (
      (!isOpen || isFirstFetch) &&
      (status !== Status.LOADING || isFirstFetch)
    ) {
      isFirstFetch = false
      const limit = NOTIFICATION_LIMIT_DEFAULT
      const hasAccount: ReturnType<typeof getHasAccount> = yield* select(
        getHasAccount
      )
      if (!hasAccount) return
      const timeOffset = moment().toISOString()
      const withDethroned =
        ((yield* call(
          getFeatureEnabled,
          FeatureFlags.SUPPORTER_DETHRONED_ENABLED
        )) as boolean | null) ?? false

      const notificationsResponse: NotificationsResponse | undefined =
        yield* call(() =>
          audiusBackendInstance.getNotifications({
            limit,
            timeOffset,
            withDethroned
          })
        )
      if (
        !notificationsResponse ||
        ('error' in notificationsResponse &&
          'isRequestError' in notificationsResponse)
      ) {
        const isReachable: ReturnType<typeof getIsReachable> = yield* select(
          getIsReachable
        )
        if (isReachable) {
          yield* put(
            notificationActions.fetchNotificationsFailed(
              `Error in notification polling daemon, server returned error: ${
                notificationsResponse?.error?.message ?? 'no error defined'
              }`
            )
          )
        }
        yield* delay(getPollingIntervalMs(remoteConfigInstance))
        return
      }
      const {
        notifications: notificationItems,
        totalUnread: totalUnviewed,
        playlistUpdates
      } = notificationsResponse

      yield* fork(recordPlaylistUpdatesAnalytics, playlistUpdates)

      if (notificationItems.length > 0) {
        const currentNotifications = yield* select(makeGetAllNotifications())
        const isChanged = checkIfNotificationsChanged(
          currentNotifications,
          notificationItems
        )
        if (isChanged) {
          const notifications = yield* parseAndProcessNotifications(
            notificationItems
          )

          const hasMore = notifications.length >= limit
          yield* put(
            notificationActions.setNotifications(
              notifications,
              totalUnviewed,
              hasMore
            )
          )
          yield* handleNewNotifications(notificationItems)
        }
      } else if (status !== Status.SUCCESS) {
        yield* put(
          notificationActions.fetchNotificationSucceeded(
            [], // notifications
            0, // totalUnviewed
            false // hasMore
          )
        )
      }
    }
  } catch (error) {
    const isReachable = yield* select(getIsReachable)
    if (isReachable) {
      yield* put(
        notificationActions.fetchNotificationsFailed(
          `Notification Polling Daemon Error: ${getErrorMessage(error)}`
        )
      )
    }
  }
}

export function* markAllNotificationsViewed() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* call(waitForBackendSetup)
  yield* call(audiusBackendInstance.markAllNotificationAsViewed)
  yield* put(notificationActions.markedAllAsViewed())
}

function* watchTogglePanel() {
  yield* call(waitForBackendSetup)
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
