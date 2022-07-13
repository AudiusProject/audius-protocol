import { createSelector } from 'reselect'

import { Collection } from 'common/models/Collection'
import { Track } from 'common/models/Track'
import { CommonState } from 'common/store'
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
  Achievement,
  Announcement,
  EntityType
} from './types'

const getBaseState = (state: CommonState) => state.pages.notifications

// Notification selectors
export const getNotificationPanelIsOpen = (state: CommonState) =>
  getBaseState(state).panelIsOpen
export const getNotificationModalIsOpen = (state: CommonState) =>
  getBaseState(state).modalIsOpen
export const getAllNotifications = (state: CommonState) =>
  getBaseState(state).notifications
export const getModalNotificationId = (state: CommonState) =>
  getBaseState(state).modalNotificationId
export const getModalNotificationIds = (state: CommonState) =>
  getBaseState(state).allIds
export const getNotificationUnviewedCount = (state: CommonState) =>
  getBaseState(state).totalUnviewed
export const getNotificationStatus = (state: CommonState) =>
  getBaseState(state).status
export const getNotificationHasMore = (state: CommonState) =>
  getBaseState(state).hasMore
export const getNotificationUserList = (state: CommonState) =>
  getBaseState(state).userList
export const getNotificationHasLoaded = (state: CommonState) =>
  getBaseState(state).hasLoaded

export const getLastNotification = (state: CommonState) => {
  const allIds = getBaseState(state).allIds
  if (allIds.length === 0) return null
  const lastNotificationId = allIds[allIds.length - 1]
  return getBaseState(state).notifications[lastNotificationId]
}

export const getNotificationById = (
  state: CommonState,
  notificationId: string
) => getBaseState(state).notifications[notificationId]

export const getModalNotification = (state: CommonState) =>
  getBaseState(state).modalNotificationId
    ? (getBaseState(state).notifications[
        getBaseState(state).modalNotificationId!
      ] as Announcement) || null
    : null

export const getPlaylistUpdates = (state: CommonState) =>
  getBaseState(state).playlistUpdates

export const makeGetAllNotifications = () => {
  return createSelector(
    [getModalNotificationIds, getAllNotifications],
    (notificationIds, notifications) => {
      return notificationIds.map(
        (notificationId) => notifications[notificationId]
      )
    }
  )
}

export const getNotificationUser = (
  state: CommonState,
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
  state: CommonState,
  notification: Notification,
  limit: number
) => {
  if ('userIds' in notification) {
    const userIds = notification.userIds.slice(0, limit)
    const userMap = getUsers(state, { ids: userIds })
    return userIds.map((id) => userMap[id])
  }
  return null
}

export const getNotificationEntity = (
  state: CommonState,
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
  state: CommonState,
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
      .filter((entity): entity is EntityType => !!entity)
    return entities
  } else if (notification.type === NotificationType.AddTrackToPlaylist) {
    const track = getTrack(state, { id: notification.trackId })
    const playlist = getCollection(state, { id: notification.playlistId })
    const playlistOwner = getUser(state, { id: notification.playlistOwnerId })
    return { track, playlist: { ...playlist, user: playlistOwner } }
  }
  return null
}
