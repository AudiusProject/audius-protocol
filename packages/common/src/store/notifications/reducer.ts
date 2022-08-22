import { Status } from '../../models/Status'

import * as actions from './actions'
import * as types from './types'
import { NotificationState, Notification } from './types'

const initialState: NotificationState = {
  notifications: {},
  allIds: [],
  // Boolean the if the first call for notifications has returned
  hasLoaded: false,
  panelIsOpen: false,
  totalUnviewed: 0,
  modalNotificationId: undefined,
  modalIsOpen: false,
  lastTimeStamp: undefined,
  hasMore: true,
  status: Status.LOADING,
  userList: {
    userIds: [],
    status: undefined,
    limit: 0
  },
  playlistUpdates: []
}

const actionsMap: any = {
  [actions.FETCH_NOTIFICATIONS_REQUESTED](state: NotificationState) {
    return {
      ...state,
      status: Status.LOADING
    }
  },
  [actions.FETCH_NOTIFICATIONS_FAILED](state: NotificationState) {
    return {
      ...state,
      hasMore: false,
      status: Status.ERROR
    }
  },
  [actions.FETCH_NOTIFICATIONS_SUCCEEDED](
    state: NotificationState,
    action: types.FetchNotificationsSucceeded
  ) {
    const notificationIds = action.notifications.map(({ id }) => id)
    return {
      ...state,
      notifications: action.notifications.reduce(
        (notifMap, notification) => {
          notifMap[notification.id] = notification
          return notifMap
        },
        { ...state.notifications }
      ),
      allIds: state.allIds.concat(notificationIds),
      totalUnviewed: action.totalUnviewed || state.totalUnviewed,
      status: Status.SUCCESS,
      hasMore: action.hasMore,
      hasLoaded: true
    }
  },
  [actions.SET_NOTIFICATIONS](
    state: NotificationState,
    action: types.SetNotifications
  ) {
    const notificationIds = action.notifications.map(({ id }) => id)
    return {
      ...state,
      notifications: action.notifications.reduce(
        (notifMap: { [id: string]: Notification }, notification) => {
          notifMap[notification.id] = notification
          return notifMap
        },
        {}
      ),
      allIds: notificationIds,
      totalUnviewed: action.totalUnviewed,
      status: Status.SUCCESS,
      hasMore: action.hasMore,
      hasLoaded: true
    }
  },
  [actions.SET_NOTIFICATION_USERS](
    state: NotificationState,
    action: types.SetNotificationUsers
  ) {
    return {
      ...state,
      userList: {
        userIds: action.userIds,
        status: undefined,
        limit: action.limit
      }
    }
  },
  [actions.FETCH_NOTIFICATIONS_USERS_REQUESTED](state: NotificationState) {
    return {
      ...state,
      userList: {
        ...state.userList,
        status: Status.LOADING
      }
    }
  },
  [actions.FETCH_NOTIFICATIONS_USERS_FAILED](state: NotificationState) {
    return {
      ...state,
      userList: {
        ...state.userList,
        status: Status.ERROR
      }
    }
  },
  [actions.FETCH_NOTIFICATIONS_USERS_SUCCEEDED](
    state: NotificationState,
    action: types.FetchNotificationUsersSucceeded
  ) {
    return {
      ...state,
      userList: {
        ...state.userList,
        limit: action.limit,
        status: Status.SUCCESS
      }
    }
  },
  [actions.SET_TOTAL_UNVIEWED_TO_ZERO](state: NotificationState) {
    return {
      ...state,
      totalUnviewed: 0
    }
  },
  [actions.SET_NOTIFICATION_MODAL](
    state: NotificationState,
    action: types.SetNotificationModal
  ) {
    return {
      ...state,
      modalIsOpen: action.open,
      modalNotificationId: action.notificationId
    }
  },
  [actions.MARK_ALL_AS_VIEWED](state: NotificationState) {
    const notificationIds = Object.keys(state.notifications)
    const viewedNotifications: Record<string, Notification> = {}

    notificationIds.forEach((id) => {
      const notification = state.notifications[id]
      const viewedNotification = { ...notification, isViewed: true }
      viewedNotifications[id] = viewedNotification
    })

    return {
      ...state,
      notifications: viewedNotifications,
      totalUnviewed: 0
    }
  },
  [actions.TOGGLE_NOTIFICATION_PANEL](state: NotificationState) {
    return { ...state, panelIsOpen: !state.panelIsOpen }
  },
  [actions.SET_PLAYLIST_UPDATES](
    state: NotificationState,
    action: types.SetPlaylistUpdates
  ) {
    if (
      action.playlistUpdates.length === 0 &&
      state.playlistUpdates.length === 0
    ) {
      return state
    }

    return {
      ...state,
      playlistUpdates: action.playlistUpdates || []
    }
  },
  [actions.UPDATE_PLAYLIST_VIEW](
    state: NotificationState,
    action: types.UpdatePlaylistLastViewedAt
  ) {
    return {
      ...state,
      playlistUpdates: state.playlistUpdates.filter(
        (id) => id !== action.playlistId
      )
    }
  }
}

const reducer = (
  state: NotificationState = initialState,
  action: types.NotificationAction
): NotificationState => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
