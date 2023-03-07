import { FeatureFlags, getContext, IntKeys } from '@audius/common'
import { call, fork } from 'typed-redux-saga'

import { recordPlaylistUpdatesAnalytics } from './playlistUpdates'

type FetchNotificationsParams = {
  limit: number
  // ISO string
  timeOffset: string
  groupIdOffset?: string
}

export function* fetchNotifications(config: FetchNotificationsParams) {
  const { limit, timeOffset, groupIdOffset } = config
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

  const discoveryNotificationsGenesisTimestamp = remoteConfig.getRemoteVar(
    IntKeys.DISCOVERY_NOTIFICATIONS_GENESIS_TIMESTAMP
  )

  const shouldFetchNotificationFromDiscovery =
    useDiscoveryNotifications &&
    discoveryNotificationsGenesisTimestamp &&
    discoveryNotificationsGenesisTimestamp > Date.parse(timeOffset)

  if (shouldFetchNotificationFromDiscovery) {
    const timestampParam = Math.trunc(Date.parse(timeOffset) / 1000)
    const discoveryNotifications = yield* call(
      audiusBackendInstance.getDiscoveryNotifications,
      {
        timestamp: timestampParam,
        groupIdOffset
      }
    )

    if (discoveryNotifications) {
      const { notifications } = discoveryNotifications
      const hasCrossedGenesisTimestamp = notifications.some(
        (notification) =>
          Date.parse(notification.timestamp) <
          discoveryNotificationsGenesisTimestamp
      )

      if (!hasCrossedGenesisTimestamp) {
        notificationsResponse.notifications = notifications
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
