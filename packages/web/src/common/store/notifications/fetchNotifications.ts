import {
  FeatureFlags,
  getContext,
  IntKeys,
  removeNullable
} from '@audius/common'
import { partition } from 'lodash'
import moment from 'moment'
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
    Date.parse(timeOffset) > discoveryNotificationsGenesisTimestamp

  if (shouldFetchNotificationFromDiscovery) {
    const timestampParam = Math.trunc(Date.parse(timeOffset) / 1000)

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
        timestamp: timestampParam,
        groupIdOffset,
        limit,
        validTypes
      }
    )

    if (discoveryNotifications) {
      const { notifications } = discoveryNotifications
      const [invalidNotifications, validNotifications] = partition(
        notifications,
        (notification) =>
          Date.parse(notification.timestamp) <
          discoveryNotificationsGenesisTimestamp
      )

      notificationsResponse.notifications = validNotifications

      if (invalidNotifications.length !== 0) {
        const newLimit = limit - validNotifications.length
        const newTimestamp = moment(
          validNotifications[validNotifications.length - 1].timestamp
        ).toISOString()

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
