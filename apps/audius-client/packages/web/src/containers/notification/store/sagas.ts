import moment from 'moment'
import { delay, eventChannel } from 'redux-saga'
import {
  call,
  fork,
  all,
  take,
  put,
  takeEvery,
  select
} from 'redux-saga/effects'

import { Name } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import Status from 'common/models/Status'
import { Track } from 'common/models/Track'
import { getUserId, getHasAccount } from 'common/store/account/selectors'
import { retrieveCollections } from 'common/store/cache/collections/utils'
import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { fetchUsers } from 'common/store/cache/users/sagas'
import AudiusBackend from 'services/AudiusBackend'
import { ResetNotificationsBadgeCount } from 'services/native-mobile-interface/notifications'
import { getRemoteVar, IntKeys } from 'services/remote-config'
import { remoteConfigIntDefaults } from 'services/remote-config/defaults'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import { getIsReachable } from 'store/reachability/selectors'
import { isElectron } from 'utils/clientUtil'
import { waitForValue } from 'utils/sagaHelpers'

import * as notificationActions from './actions'
import { watchNotificationError } from './errorSagas'
import mobileSagas from './mobileSagas'
import {
  getLastNotification,
  getNotificationById,
  getNotificationUserList,
  getNotificationPanelIsOpen,
  getNotificationStatus,
  makeGetAllNotifications,
  getAllNotifications,
  getPlaylistUpdates
} from './selectors'
import { Notification, Entity, NotificationType, Achievement } from './types'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

// The initial user count to load in for each notification
// NOTE: the rest are loading in in the user list modal
export const USER_INITIAL_LOAD_COUNT = 9

// Gets the polling interval from remoteconfig
const getPollingIntervalMs = () => {
  const pollingInterval = getRemoteVar(IntKeys.NOTIFICATION_POLLING_FREQ_MS)
  return (
    pollingInterval ??
    (remoteConfigIntDefaults[IntKeys.NOTIFICATION_POLLING_FREQ_MS] as number)
  )
}

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
  const existingUpdates: ID[] = yield select(getPlaylistUpdates)
  yield put(notificationActions.setPlaylistUpdates(playlistUpdates))
  if (
    playlistUpdates.length > 0 &&
    existingUpdates.length !== playlistUpdates.length
  ) {
    const event = make(Name.PLAYLIST_LIBRARY_HAS_UPDATE, {
      count: playlistUpdates.length
    })
    yield put(event)
  }
}

/**
 * Fetch notifications, used by notification pagination
 * This is the function used to fetch more notifcations after the initial load in getNotifications
 */
export function* fetchNotifications(
  action: notificationActions.FetchNotifications
) {
  try {
    yield put(notificationActions.fetchNotificationsRequested())
    const limit = action.limit || NOTIFICATION_LIMIT_DEFAULT
    const lastNotification = yield select(getLastNotification)
    const dateOffset = lastNotification
      ? lastNotification.timestamp
      : moment().toISOString()
    const notificationsResponse = yield call(
      AudiusBackend.getNotifications,
      limit,
      dateOffset
    )
    if (notificationsResponse.error) {
      yield put(
        notificationActions.fetchNotificationsFailed(
          notificationsResponse.error.message
        )
      )
      return
    }
    const {
      notifications: notificationItems,
      totalUnread,
      playlistUpdates
    }: {
      notifications: Notification[]
      totalUnread: number
      playlistUpdates: number[]
    } = notificationsResponse

    const notifications = yield parseAndProcessNotifications(notificationItems)

    const hasMore = notifications.length >= limit

    yield fork(recordPlaylistUpdatesAnalytics, playlistUpdates)
    yield put(
      notificationActions.fetchNotificationSucceeded(
        notifications,
        totalUnread,
        hasMore
      )
    )
  } catch (error) {
    const isReachable = yield select(getIsReachable)
    if (isReachable) {
      yield put(
        notificationActions.fetchNotificationsFailed(
          `Error in fetch notifications requested: ${error.message}`
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

  notifications.forEach(notification => {
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
  })

  const [tracks]: [Track[]] = yield all([
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
    )
  ])

  /**
   * For Milestone and Followers, update the notification entityId as the userId
   * For Remix Create, add the userId as the track owner id of the fetched child track
   * Attach a `timeLabel` to each notification as well to be displayed ie. 2 Hours Ago
   */
  const now = moment()
  const userId = yield select(getUserId)
  const remixTrackParents: Array<ID> = []
  const processedNotifications = notifications.map(notif => {
    if (
      notif.type === NotificationType.Milestone &&
      notif.achievement === Achievement.Followers
    ) {
      notif.entityId = userId
    } else if (notif.type === NotificationType.RemixCreate) {
      const childTrack = tracks.find(
        (track: Track) => track.track_id === notif.childTrackId
      )
      if (childTrack) {
        notif.userId = childTrack.owner_id
      }
    } else if (notif.type === NotificationType.RemixCosign) {
      const childTrack = tracks.find(
        (track: Track) => track.track_id === notif.childTrackId
      )
      if (childTrack && childTrack.remix_of) {
        const parentTrackIds = childTrack.remix_of.tracks.map(
          t => t.parent_track_id
        )
        remixTrackParents.push(...parentTrackIds)
        notif.entityIds.push(...parentTrackIds)
      }
    }
    notif.timeLabel = getTimeAgo(now, notif.timestamp)
    return notif
  })
  if (remixTrackParents.length > 0)
    yield call(retrieveTracks, { trackIds: remixTrackParents })
  return processedNotifications
}

export function* fetchNotificationUsers(
  action: notificationActions.FetchNotificationUsers
) {
  try {
    const userList = yield select(getNotificationUserList)
    if (userList.status === Status.LOADING) return
    yield put(notificationActions.fetchNotificationUsersRequested())
    const { userIds, limit } = yield select(getNotificationUserList)
    const newLimit = limit + action.limit
    const userIdsToFetch = userIds.slice(limit, newLimit)
    yield call(
      fetchUsers,
      userIdsToFetch,
      new Set(),
      /* forceRetrieveFromSource */ true
    )
    yield put(notificationActions.fetchNotificationUsersSucceeded(newLimit))
  } catch (error) {
    yield put(notificationActions.fetchNotificationUsersFailed(error.message))
  }
}

export function* markNotificationsRead(action: notificationActions.MarkAsRead) {
  const notification = yield select(getNotificationById, action.notificationId)
  try {
    yield call(
      AudiusBackend.markNotificationAsRead,
      action.notificationId,
      notification.type
    )
  } catch (e) {
    console.error(e)
  }
}

export function* markAllNotificationsRead() {
  yield call(AudiusBackend.markAllNotificationAsRead)
}

export function* hideNotification(
  action: notificationActions.HideNotification
) {
  const notification = yield select(getNotificationById, action.notificationId)
  yield call(
    AudiusBackend.markNotificationAsHidden,
    action.notificationId,
    notification.type
  )
}

export function* subscribeUserSettings(
  action: notificationActions.SubscribeUser
) {
  yield call(AudiusBackend.updateUserSubscription, action.userId, true)
}

export function* unsubscribeUserSettings(
  action: notificationActions.UnsubscribeUser
) {
  yield call(AudiusBackend.updateUserSubscription, action.userId, false)
}

export function* updatePlaylistLastViewedAt(
  action: notificationActions.UpdatePlaylistLastViewedAt
) {
  yield call(AudiusBackend.updatePlaylistLastViewedAt, action.playlistId)
}

// Action Watchers
function* watchFetchNotifications() {
  yield takeEvery(notificationActions.FETCH_NOTIFICATIONS, fetchNotifications)
}

function* watchFetchNotificationUsers() {
  yield takeEvery(
    notificationActions.FETCH_NOTIFICATIONS_USERS,
    fetchNotificationUsers
  )
}

function* watchMarkNotificationsRead() {
  yield takeEvery(notificationActions.MARK_AS_READ, markNotificationsRead)
}

function* watchMarkAllNotificationsRead() {
  yield takeEvery(
    notificationActions.MARK_ALL_AS_READ,
    markAllNotificationsRead
  )
}

function* watchMarkAllNotificationsViewed() {
  yield takeEvery(
    notificationActions.MARK_ALL_AS_VIEWED,
    markAllNotificationsViewed
  )
}

function* watchHideNotification() {
  yield takeEvery(notificationActions.HIDE_NOTIFICATION, hideNotification)
}

function* watchSubscribeUserSettings() {
  yield takeEvery(notificationActions.SUBSCRIBE_USER, subscribeUserSettings)
}

function* watchUnsubscribeUserSettings() {
  yield takeEvery(notificationActions.UNSUBSCRIBE_USER, unsubscribeUserSettings)
}

function* watchUpdatePlaylistLastViewedAt() {
  yield takeEvery(
    notificationActions.UPDATE_PLAYLIST_VIEW,
    updatePlaylistLastViewedAt
  )
}

type ResponseNotification = Notification & {
  id: string
  entityIds: number[]
  userIds: number[]
}

// Notifications have changed if some of the incoming ones have
// different ids or changed length in unique entities/users
const checkIfNotificationsChanged = (
  current: ResponseNotification[],
  incoming: ResponseNotification[]
): boolean => {
  return (
    incoming.length > current.length ||
    incoming.some((item: any, index: number) => {
      const notif = current[index]
      const isIdDifferent = notif.id !== item.id
      const isEntitySizeDiff =
        notif.entityIds &&
        item.entityIds &&
        new Set(notif.entityIds).size !== new Set(item.entityIds).size
      const isUsersSizeDiff =
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
  try {
    const isOpen: ReturnType<typeof getNotificationPanelIsOpen> = yield select(
      getNotificationPanelIsOpen
    )
    const status: ReturnType<typeof getNotificationStatus> = yield select(
      getNotificationStatus
    )
    if ((!isOpen || isFirstFetch) && status !== Status.LOADING) {
      isFirstFetch = false
      const limit = NOTIFICATION_LIMIT_DEFAULT
      const hasAccount: ReturnType<typeof getHasAccount> = yield select(
        getHasAccount
      )
      if (!hasAccount) return
      const dateOffset = moment().toISOString()
      const notificationsResponse = yield call(
        AudiusBackend.getNotifications,
        limit,
        dateOffset
      )
      if (
        !notificationsResponse ||
        (notificationsResponse.error && notificationsResponse.isRequestError)
      ) {
        const isReachable: ReturnType<typeof getIsReachable> = yield select(
          getIsReachable
        )
        if (isReachable) {
          yield put(
            notificationActions.fetchNotificationsFailed(
              `Error in notification polling daemon, server returned error: ${
                notificationsResponse?.error?.message ?? 'no error defined'
              }`
            )
          )
        }
        yield delay(getPollingIntervalMs())
        return
      }
      const {
        notifications: notificationItems,
        totalUnread,
        playlistUpdates
      }: {
        notifications: ResponseNotification[]
        totalUnread: number
        playlistUpdates: number[]
      } = notificationsResponse

      yield fork(recordPlaylistUpdatesAnalytics, playlistUpdates)

      if (notificationItems.length > 0) {
        const currentNotifications = yield select(makeGetAllNotifications())
        const isChanged = checkIfNotificationsChanged(
          currentNotifications,
          notificationItems
        )
        if (isChanged) {
          const notifications = yield parseAndProcessNotifications(
            notificationItems
          )

          const hasMore = notifications.length >= limit
          yield put(
            notificationActions.setNotifications(
              notifications,
              totalUnread,
              hasMore
            )
          )
        }
      } else if (status !== Status.SUCCESS) {
        yield put(
          notificationActions.fetchNotificationSucceeded(
            [], // notifications
            0, // totalUnread
            false // hasMore
          )
        )
      }
    }
  } catch (e) {
    const isReachable = yield select(getIsReachable)
    if (isReachable) {
      yield put(
        notificationActions.fetchNotificationsFailed(
          `Notification Polling Daemon Error: ${e.message}`
        )
      )
    }
  }
}

function* notificationPollingDaemon() {
  yield call(waitForBackendSetup)
  yield call(waitForValue, getHasAccount, {})
  yield call(AudiusBackend.getEmailNotificationSettings)

  // Set up daemon that will watch for browser into focus and refetch notifications
  // as soon as it goes into focus
  const visibilityChannel = eventChannel(emitter => {
    if (NATIVE_MOBILE) {
      // The focus and visibitychange events are wonky on native mobile webviews,
      // so poll for visiblity change instead
      let lastHidden = true
      setInterval(() => {
        if (!document.hidden && lastHidden) {
          emitter(true)
        }
        lastHidden = document.hidden
      }, 500)
    } else {
      document.addEventListener('visibilitychange ', () => {
        if (!document.hidden) {
          emitter(true)
        }
      })
    }
    return () => {}
  })
  yield fork(function* () {
    while (true) {
      yield take(visibilityChannel)
      yield call(getNotifications, false)
    }
  })

  // Set up daemon that will poll for notifications every 10s if the browser is
  // in the foreground
  const isFirstFetch = true
  let isBrowserInBackground = false
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        isBrowserInBackground = true
      } else {
        isBrowserInBackground = false
      }
    },
    false
  )

  while (true) {
    if (!isBrowserInBackground || isElectron()) {
      yield call(getNotifications, isFirstFetch)
    }
    yield delay(getPollingIntervalMs())
  }
}

export function* markAllNotificationsViewed() {
  yield call(waitForBackendSetup)
  yield call(AudiusBackend.markAllNotificationAsViewed)
  if (NATIVE_MOBILE) {
    const message = new ResetNotificationsBadgeCount()
    message.send()
  }
}

function* watchTogglePanel() {
  yield call(waitForBackendSetup)
  yield takeEvery(notificationActions.TOGGLE_NOTIFICATION_PANEL, function* () {
    const isOpen = yield select(getNotificationPanelIsOpen)
    if (isOpen) {
      yield put(notificationActions.markAllAsViewed())
    } else {
      // On close modal,
      const notificationMap = yield select(getAllNotifications)
      const notifications: Notification[] = Object.values(notificationMap)
      for (const notification of notifications) {
        if (
          notification.type === NotificationType.Announcement &&
          !notification.longDescription &&
          !notification.isRead
        ) {
          yield put(notificationActions.markAsRead(notification.id))
        }
      }
    }
  })
}

export default function sagas() {
  const sagas: (() => Generator)[] = [
    watchFetchNotifications,
    watchFetchNotificationUsers,
    watchMarkNotificationsRead,
    watchMarkAllNotificationsViewed,
    watchMarkAllNotificationsRead,
    watchHideNotification,
    watchSubscribeUserSettings,
    watchUnsubscribeUserSettings,
    notificationPollingDaemon,
    watchTogglePanel,
    watchNotificationError,
    watchUpdatePlaylistLastViewedAt
  ]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}
