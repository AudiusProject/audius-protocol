import { createSelector } from 'reselect'

import { Collection } from 'common/models/Collection'
import { Track } from 'common/models/Track'
import { getAccountUser } from 'common/store/account/selectors'
import {
  getCollection,
  getCollections
} from 'common/store/cache/collections/selectors'
import { getTrack, getTracks } from 'common/store/cache/tracks/selectors'
import { getUser, getUsers } from 'common/store/cache/users/selectors'
import {
  Entity,
  Notification,
  NotificationType,
  Achievement
} from 'containers/notification/store/types'
import { AppState } from 'store/types'

// Notification selectors
export const getNotificationPanelIsOpen = (state: AppState) =>
  state.notification.panelIsOpen
export const getNotificationModalIsOpen = (state: AppState) =>
  state.notification.modalIsOpen
export const getAllNotifications = (state: AppState) =>
  state.notification.notifications
export const getModalNotificationId = (state: AppState) =>
  state.notification.modalNotificationId
export const getModalNotificationIds = (state: AppState) =>
  state.notification.allIds
export const getNotificationUnreadCount = (state: AppState) =>
  state.notification.totalUnread
export const getNotificationStatus = (state: AppState) =>
  state.notification.status
export const getNotificationHasMore = (state: AppState) =>
  state.notification.hasMore
export const getNotificationUserList = (state: AppState) =>
  state.notification.userList
export const getNotificationHasLoaded = (state: AppState) =>
  state.notification.hasLoaded

export const getLastNotification = (state: AppState) => {
  const allIds = state.notification.allIds
  if (allIds.length === 0) return null
  const lastNotificationId = allIds[allIds.length - 1]
  return state.notification.notifications[lastNotificationId]
}

export const getNotificationById = (state: AppState, notificationId: string) =>
  state.notification.notifications[notificationId]

export const getModalNotification = (state: AppState) =>
  state.notification.modalNotificationId
    ? state.notification.notifications[
        state.notification.modalNotificationId
      ] || null
    : null

export const getPlaylistUpdates = (state: AppState) =>
  state.notification.playlistUpdates

export const makeGetAllNotifications = () => {
  return createSelector(
    [getModalNotificationIds, getAllNotifications],
    (notificationIds, notifications) => {
      return notificationIds.map(
        notificationId => notifications[notificationId]
      )
    }
  )
}

export const makeGetNotificationsUnreadCount = () => {
  return createSelector([getAllNotifications], notifications => {
    return Object.values(notifications).reduce(
      (count, notification) => count + (notification.isRead ? 0 : 1),
      0
    )
  })
}

export const getNotificationUser = (
  state: AppState,
  notification: Notification
) => {
  if (
    notification.type === NotificationType.Milestone &&
    notification.achievement === Achievement.Followers
  ) {
    return getAccountUser(state)
  } else if ('userId' in notification) {
    return getUser(state, { id: notification.userId })
  } else if (
    'entityId' in notification &&
    'entityType' in notification &&
    notification.entityType === Entity.User
  ) {
    return getUser(state, { id: notification.entityId })
  }
}

export const getNotificationUsers = (
  state: AppState,
  notification: Notification,
  limit: number
) => {
  if ('userIds' in notification) {
    const userIds = notification.userIds.slice(0, limit)
    const userMap = getUsers(state, { ids: userIds })
    return userIds.map(id => userMap[id])
  }
  return null
}

export const getNotificationEntity = (
  state: AppState,
  notification: Notification
) => {
  if (
    'entityId' in notification &&
    'entityType' in notification &&
    notification.entityType !== Entity.User
  ) {
    const getEntity =
      notification.entityType === Entity.Track ? getTrack : getCollection
    const entity = getEntity(state, { id: notification.entityId })
    if (entity) {
      const userId =
        'owner_id' in entity ? entity.owner_id : entity.playlist_owner_id
      return {
        ...entity,
        user: getUser(state, { id: userId })
      }
    }
    return entity
  }
  return null
}

export const getNotificationEntities = (
  state: AppState,
  notification: Notification
) => {
  if ('entityIds' in notification && 'entityType' in notification) {
    const getEntities =
      notification.entityType === Entity.Track ? getTracks : getCollections
    const entityMap = getEntities(state, { ids: notification.entityIds })
    const entities = notification.entityIds
      .map((id: number) => (entityMap as any)[id])
      .map((entity: Track | Collection | null) => {
        if (entity) {
          const userId =
            'owner_id' in entity ? entity.owner_id : entity.playlist_owner_id
          return {
            ...entity,
            user: getUser(state, { id: userId })
          }
        }
        return null
      })
      .filter(Boolean)
    return entities
  }
  return null
}
