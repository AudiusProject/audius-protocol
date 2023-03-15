import {
  FeatureFlags,
  getContext,
  IntKeys,
  removeNullable
} from '@audius/common'
import { partition } from 'lodash'
import { call, fork } from 'typed-redux-saga'

import { recordPlaylistUpdatesAnalytics } from './playlistUpdates'

type FetchNotificationsParams = {
  limit: number
  // unix timestamp
  timeOffset?: number
  groupIdOffset?: string
}

export function* fetchNotifications(config: FetchNotificationsParams) {
  const {
    limit,
    timeOffset = Math.round(new Date().getTime() / 1000), // current unix timestamp (sec)
    groupIdOffset
  } = config
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const remoteConfig = yield* getContext('remoteConfigInstance')

  const withDethroned = yield* call(
    getFeatureEnabled,
    FeatureFlags.SUPPORTER_DETHRONED_ENABLED
  )

  const useDiscoveryNotifications = yield* call(
    getFeatureEnabled,
    FeatureFlags.DISCOVERY_NOTIFICATIONS
  )

  const notificationsResponse = yield* call(
    audiusBackendInstance.getNotifications,
    {
      limit,
      timeOffset,
      withDethroned
    }
  )

  if ('error' in notificationsResponse) {
    return notificationsResponse
  }

  const discoveryNotificationsGenesisUnixTimestamp = remoteConfig.getRemoteVar(
    IntKeys.DISCOVERY_NOTIFICATIONS_GENESIS_UNIX_TIMESTAMP
  )

  const shouldFetchNotificationFromDiscovery =
    useDiscoveryNotifications &&
    discoveryNotificationsGenesisUnixTimestamp &&
    timeOffset > discoveryNotificationsGenesisUnixTimestamp

  if (shouldFetchNotificationFromDiscovery) {
    const isRepostOfRepostEnabled = yield* call(
      getFeatureEnabled,
      FeatureFlags.REPOST_OF_REPOST_NOTIFICATIONS
    )
    const isSaveOfRepostEnabled = yield* call(
      getFeatureEnabled,
      FeatureFlags.SAVE_OF_REPOST_NOTIFICATIONS
    )

    const validTypes = [
      isRepostOfRepostEnabled ? 'repost_of_repost' : null,
      isSaveOfRepostEnabled ? 'save_of_repost' : null
    ].filter(removeNullable)

    const discoveryNotifications = yield* call(
      audiusBackendInstance.getDiscoveryNotifications,
      {
        timestamp: timeOffset,
        groupIdOffset,
        limit,
        validTypes
      }
    )

    if (discoveryNotifications) {
      const { notifications, totalUnread } = discoveryNotifications
      const [invalidNotifications, validNotifications] = partition(
        notifications,
        ({ timestamp }) =>
          timestamp < discoveryNotificationsGenesisUnixTimestamp
      )

      notificationsResponse.notifications = validNotifications
      notificationsResponse.totalUnread = totalUnread

      if (invalidNotifications.length !== 0) {
        const newLimit = limit - validNotifications.length
        const newTimestamp =
          validNotifications[validNotifications.length - 1]?.timestamp ??
          timeOffset

        const legacyNotificationsResponse = yield* call(
          audiusBackendInstance.getNotifications,
          {
            limit: newLimit,
            timeOffset: newTimestamp,
            withDethroned
          }
        )

        if ('error' in legacyNotificationsResponse) {
          notificationsResponse.notifications = validNotifications
        } else {
          notificationsResponse.notifications =
            notificationsResponse.notifications.concat(
              legacyNotificationsResponse.notifications
            )
        }
      }
    }
  }

  const {
    notifications,
    totalUnread: totalUnviewed,
    playlistUpdates
  } = notificationsResponse

  yield* fork(recordPlaylistUpdatesAnalytics, playlistUpdates)

  return { notifications, totalUnviewed }
}
