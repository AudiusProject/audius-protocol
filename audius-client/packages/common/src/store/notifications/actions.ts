import { ID } from '../../models/Identifiers'

import { Notification } from './types'

export const FETCH_NOTIFICATIONS = 'NOTIFICATION/FETCH_NOTIFICATIONS'
export const FETCH_NOTIFICATIONS_REQUESTED =
  'NOTIFICATION/FETCH_NOTIFICATIONS_REQUESTED'
export const FETCH_NOTIFICATIONS_SUCCEEDED =
  'NOTIFICATION/FETCH_NOTIFICATIONS_SUCCEEDED'
export const FETCH_NOTIFICATIONS_FAILED =
  'NOTIFICATION/FETCH_NOTIFICATIONS_FAILED'

export const REFRESH_NOTIFICATIONS = 'NOTIFICATION/REFRESH_NOTIFICATIONS'

export const SET_NOTIFICATIONS = 'NOTIFICATION/SET_NOTIFICATIONS'

export const FETCH_NOTIFICATIONS_USERS =
  'NOTIFICATION/FETCH_NOTIFICATIONS_USERS'
export const FETCH_NOTIFICATIONS_USERS_REQUESTED =
  'NOTIFICATION/FETCH_NOTIFICATIONS_USERS_REQUESTED'
export const FETCH_NOTIFICATIONS_USERS_SUCCEEDED =
  'NOTIFICATION/FETCH_NOTIFICATIONS_USERS_SUCCEEDED'
export const FETCH_NOTIFICATIONS_USERS_FAILED =
  'NOTIFICATION/FETCH_NOTIFICATIONS_USERS_FAILED'
export const SET_NOTIFICATION_USERS = 'NOTIFICATION/SET_NOTIFICATION_USERS'

export const SET_TOTAL_UNVIEWED_TO_ZERO =
  'NOTIFICATION/SET_TOTAL_UNVIEWED_TO_ZERO'
export const MARK_ALL_AS_VIEWED = 'NOTIFICATION/MARK_ALL_AS_VIEWED'

export const TOGGLE_NOTIFICATION_PANEL =
  'NOTIFICATION/TOGGLE_NOTIFICATION_PANEL'
export const SET_NOTIFICATION_MODAL = 'NOTIFICATION/SET_NOTIFICATION_MODAL'
export const SUBSCRIBE_USER = 'NOTIFICATION/SUBSCRIBE_USER'
export const UNSUBSCRIBE_USER = 'NOTIFICATION/UNSUBSCRIBE_USER'

export const SET_PLAYLIST_UPDATES = 'NOTIFICATION/SET_PLAYLIST_UPDATES'
export const UPDATE_PLAYLIST_VIEW = 'NOTIFICATION/UPDATE_PLAYLIST_VIEW'

export const fetchNotifications = (limit = 10, fromLast = true) => ({
  type: FETCH_NOTIFICATIONS,
  limit,
  fromLast
})

export const fetchNotificationsRequested = () => ({
  type: FETCH_NOTIFICATIONS_REQUESTED
})
export const fetchNotificationsFailed = (
  message = '',
  shouldReport = true
) => ({
  type: FETCH_NOTIFICATIONS_FAILED,
  message,
  shouldReport
})
export const fetchNotificationSucceeded = (
  notifications: Notification[],
  totalUnviewed: number,
  hasMore: boolean
) => ({
  type: FETCH_NOTIFICATIONS_SUCCEEDED,
  notifications,
  hasMore,
  totalUnviewed
})

export const refreshNotifications = () => ({
  type: REFRESH_NOTIFICATIONS
})

export const setNotifications = (
  notifications: Notification[],
  totalUnviewed: number,
  hasMore: boolean
) => ({
  type: SET_NOTIFICATIONS,
  notifications,
  hasMore,
  totalUnviewed
})

export const setNotificationUsers = (userIds: ID[] = [], limit = 0) => {
  return {
    type: SET_NOTIFICATION_USERS,
    userIds,
    limit
  }
}
export const fetchNotificationUsers = (limit = 10) => ({
  type: FETCH_NOTIFICATIONS_USERS,
  limit
})
export const fetchNotificationUsersRequested = () => ({
  type: FETCH_NOTIFICATIONS_USERS_REQUESTED
})
export const fetchNotificationUsersFailed = (
  message = '',
  shouldReport = true
) => ({
  type: FETCH_NOTIFICATIONS_USERS_FAILED,
  message,
  shouldReport
})
export const fetchNotificationUsersSucceeded = (limit: number) => ({
  type: FETCH_NOTIFICATIONS_USERS_SUCCEEDED,
  limit
})

export const setTotalUnviewedToZero = () => ({
  type: SET_TOTAL_UNVIEWED_TO_ZERO
})

export const markAllAsViewed = () => ({ type: MARK_ALL_AS_VIEWED })

export const setNotificationModal = (
  open: boolean,
  notificationId?: string
) => ({
  type: SET_NOTIFICATION_MODAL,
  open,
  notificationId
})

export const toggleNotificationPanel = () => ({
  type: TOGGLE_NOTIFICATION_PANEL
})
export const subscribeUser = (userId: ID) => ({ type: SUBSCRIBE_USER, userId })
export const unsubscribeUser = (userId: ID) => ({
  type: UNSUBSCRIBE_USER,
  userId
})

export const setPlaylistUpdates = (playlistUpdates: number[]) => ({
  type: SET_PLAYLIST_UPDATES,
  playlistUpdates
})

export const updatePlaylistLastViewedAt = (playlistId: number) => ({
  type: UPDATE_PLAYLIST_VIEW,
  playlistId
})
