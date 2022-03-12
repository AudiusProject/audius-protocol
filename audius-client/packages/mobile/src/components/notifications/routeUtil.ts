import { Track } from 'audius-client/src/common/models/Track'
import {
  Achievement,
  Notification,
  Entity,
  NotificationType
} from 'audius-client/src/common/store/notifications/types'
import Config from 'react-native-config'

import {
  getTrackRoute,
  getUserRoute,
  getCollectionRoute,
  getAudioPageRoute
} from 'app/utils/routes'

const AUDIUS_URL = Config.AUDIUS_URL

export const getUserListRoute = (
  notification: Notification,
  fullUrl = false
) => {
  const route = `/notification/${notification.id}/users`
  return fullUrl ? `${AUDIUS_URL}${route}` : route
}

export const getEntityRoute = (
  entity: any,
  entityType: Entity,
  fullUrl = false
) => {
  switch (entityType) {
    case Entity.Track:
      return getTrackRoute(entity, fullUrl)
    case Entity.User:
      return getUserRoute(entity, fullUrl)
    case Entity.Album:
    case Entity.Playlist:
      return getCollectionRoute(entity, fullUrl)
  }
}

export const getEntityScreen = (entity: any, entityType: Entity) => {
  switch (entityType) {
    case Entity.Track:
      return { screen: 'Track' as const, params: { id: entity.track_id } }
    case Entity.User:
      return { screen: 'Profile' as const, params: { handle: entity.handle } }
    case Entity.Album:
    case Entity.Playlist:
      return {
        screen: 'Collection' as const,
        params: { id: entity.playlist_id }
      }
  }
}

export const getNotificationRoute = (notification: Notification) => {
  switch (notification.type) {
    case NotificationType.Announcement:
      return null
    case NotificationType.Follow: {
      const users = notification.users
      const isMultiUser = !!users && users.length > 1
      if (isMultiUser) {
        return getUserListRoute(notification)
      }
      const firstUser = notification?.users?.[0]
      if (!firstUser) return null
      return getUserRoute(firstUser)
    }
    case NotificationType.UserSubscription:
      if (!notification?.entities?.[0]) return null
      return getEntityRoute(notification.entities[0], notification.entityType)
    case NotificationType.Favorite:
      return getEntityRoute(notification.entity, notification.entityType)
    case NotificationType.Repost:
      return getEntityRoute(notification.entity, notification.entityType)
    case NotificationType.Milestone:
      if (notification.achievement === Achievement.Followers) {
        if (!notification.user) return ''
        return getUserRoute(notification.user)
      }
      return getEntityRoute(notification.entity, notification.entityType)
    case NotificationType.RemixCosign: {
      const original = notification.entities.find(
        (track: Track) => track.owner_id === notification.parentTrackUserId
      )
      return getEntityRoute(original, Entity.Track)
    }
    case NotificationType.RemixCreate: {
      const remix = notification.entities.find(
        (track: Track) => track.track_id === notification.childTrackId
      )
      return getEntityRoute(remix, Entity.Track)
    }
    case NotificationType.TrendingTrack:
      return getEntityRoute(notification.entity, notification.entityType)
    case NotificationType.ChallengeReward:
    case NotificationType.TierChange:
      return getAudioPageRoute()
  }
}

export const getNotificationScreen = (notification: Notification) => {
  switch (notification.type) {
    case NotificationType.Announcement:
      return null
    case NotificationType.Follow: {
      const users = notification.users
      const isMultiUser = !!users && users.length > 1
      if (isMultiUser) {
        return {
          screen: 'NotificationUsers' as const,
          params: {
            notificationType: notification.type,
            count: users.length,
            id: notification.id
          }
        }
      }
      const firstUser = notification?.users?.[0]
      if (!firstUser) return null
      return {
        screen: 'Profile' as const,
        params: { handle: firstUser.handle }
      }
    }
    case NotificationType.UserSubscription:
      if (!notification?.entities?.[0]) return null
      return getEntityScreen(notification.entities[0], notification.entityType)
    case NotificationType.Favorite:
      return getEntityScreen(notification.entity, notification.entityType)
    case NotificationType.Repost:
      return getEntityScreen(notification.entity, notification.entityType)
    case NotificationType.Milestone:
      if (notification.achievement === Achievement.Followers) {
        if (!notification.user) return ''
        const { handle } = notification.user
        return { screen: 'Profile' as const, params: { handle } }
      }
      return getEntityScreen(notification.entity, notification.entityType)
    case NotificationType.RemixCosign: {
      const original = notification.entities.find(
        (track: Track) => track.owner_id === notification.parentTrackUserId
      )
      return getEntityScreen(original, Entity.Track)
    }
    case NotificationType.RemixCreate: {
      const remix = notification.entities.find(
        (track: Track) => track.track_id === notification.childTrackId
      )
      return getEntityScreen(remix, Entity.Track)
    }
    case NotificationType.TrendingTrack:
      return getEntityScreen(notification.entity, notification.entityType)
    case NotificationType.ChallengeReward:
    case NotificationType.TierChange:
      return { screen: 'AudioScreen' as const, params: undefined }
  }
}
