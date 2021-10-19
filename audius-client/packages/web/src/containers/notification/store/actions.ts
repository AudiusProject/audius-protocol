import { ID } from 'common/models/Identifiers'

import { Notification } from './types'

export const FETCH_NOTIFICATIONS = 'NOTIFICATION/FETCH_NOTIFICATIONS'
export const FETCH_NOTIFICATIONS_REQUESTED =
  'NOTIFICATION/FETCH_NOTIFICATIONS_REQUESTED'
export const FETCH_NOTIFICATIONS_SUCCEEDED =
  'NOTIFICATION/FETCH_NOTIFICATIONS_SUCCEEDED'
export const FETCH_NOTIFICATIONS_FAILED =
  'NOTIFICATION/FETCH_NOTIFICATIONS_FAILED'

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

export const MARK_AS_READ = 'NOTIFICATION/MARK_AS_READ'
export const MARK_ALL_AS_READ = 'NOTIFICATION/MARK_ALL_AS_READ'
export const MARK_ALL_AS_VIEWED = 'NOTIFICATION/MARK_ALL_AS_VIEWED'

export const HIDE_NOTIFICATION = 'NOTIFICATION/HIDE_NOTIFICATION'
export const TOGGLE_NOTIFICATION_PANEL =
  'NOTIFICATION/TOGGLE_NOTIFICATION_PANEL'
export const SET_NOTIFICATION_MODAL = 'NOTIFICATION/SET_NOTIFICATION_MODAL'
export const SUBSCRIBE_USER = 'NOTIFICATION/SUBSCRIBE_USER'
export const UNSUBSCRIBE_USER = 'NOTIFICATION/UNSUBSCRIBE_USER'

export const SET_PLAYLIST_UPDATES = 'NOTIFICATION/SET_PLAYLIST_UPDATES'
export const UPDATE_PLAYLIST_VIEW = 'NOTIFICATION/UPDATE_PLAYLIST_VIEW'

export const fetchNotifications = (limit = 10) => ({
  type: FETCH_NOTIFICATIONS,
  limit
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
  totalUnread: number,
  hasMore: boolean
) => ({
  type: FETCH_NOTIFICATIONS_SUCCEEDED,
  notifications,
  hasMore,
  totalUnread
})

export const setNotifications = (
  notifications: Notification[],
  totalUnread: number,
  hasMore: boolean
) => ({
  type: SET_NOTIFICATIONS,
  notifications,
  hasMore,
  totalUnread
})

export const setNotificationUsers = (userIds: ID[] = [], limit = 0) => ({
  type: SET_NOTIFICATION_USERS,
  userIds,
  limit
})
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

export const markAsRead = (notificationId: string) => ({
  type: MARK_AS_READ,
  notificationId
})

export const hideNotification = (notificationId: string) => ({
  type: HIDE_NOTIFICATION,
  notificationId
})

export const markAllAsRead = () => ({ type: MARK_ALL_AS_READ })
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

export type FetchNotifications = ReturnType<typeof fetchNotifications>
export type FetchNotificationsRequested = ReturnType<
  typeof fetchNotificationsRequested
>
export type FetchNotificationsFailed = ReturnType<
  typeof fetchNotificationsFailed
>
export type FetchNotificationsSucceeded = ReturnType<
  typeof fetchNotificationSucceeded
>
export type SetNotifications = ReturnType<typeof setNotifications>
export type SetNotificationUsers = ReturnType<typeof setNotificationUsers>
export type FetchNotificationUsers = ReturnType<typeof fetchNotificationUsers>
export type FetchNotificationUsersRequested = ReturnType<
  typeof fetchNotificationUsersRequested
>
export type FetchNotificationUsersFailed = ReturnType<
  typeof fetchNotificationUsersFailed
>
export type FetchNotificationUsersSucceeded = ReturnType<
  typeof fetchNotificationUsersSucceeded
>
export type MarkAsRead = ReturnType<typeof markAsRead>
export type HideNotification = ReturnType<typeof hideNotification>
export type MarkAllAsRead = ReturnType<typeof markAllAsRead>
export type MarkAllAsViewed = ReturnType<typeof markAllAsViewed>
export type SetNotificationModal = ReturnType<typeof setNotificationModal>
export type ToggleNotificationPanel = ReturnType<typeof toggleNotificationPanel>
export type SubscribeUser = ReturnType<typeof subscribeUser>
export type UnsubscribeUser = ReturnType<typeof unsubscribeUser>
export type SetPlaylistUpdates = ReturnType<typeof setPlaylistUpdates>
export type UpdatePlaylistLastViewedAt = ReturnType<
  typeof updatePlaylistLastViewedAt
>

export type NotificationAction =
  | FetchNotifications
  | FetchNotificationsRequested
  | FetchNotificationsFailed
  | FetchNotificationsSucceeded
  | SetNotifications
  | SetNotificationUsers
  | FetchNotificationUsers
  | FetchNotificationUsersRequested
  | FetchNotificationUsersFailed
  | FetchNotificationUsersSucceeded
  | MarkAsRead
  | HideNotification
  | MarkAllAsRead
  | MarkAllAsViewed
  | SetNotificationModal
  | ToggleNotificationPanel
  | SubscribeUser
  | UnsubscribeUser
  | SetPlaylistUpdates
  | UpdatePlaylistLastViewedAt
