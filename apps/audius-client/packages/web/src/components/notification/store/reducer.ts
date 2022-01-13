import Status from 'common/models/Status'

import * as actions from './actions'
import NotificationState, { Notification } from './types'

const initialState: NotificationState = {
  notifications: {},
  allIds: [],
  // Boolean the if the first call for notifications has returned
  hasLoaded: false,
  panelIsOpen: false,
  totalUnread: 0,
  modalNotificationId: undefined,
  modalIsOpen: false,
  lastTimeStamp: undefined,
  hasMore: true,
  status: undefined,
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
    action: actions.FetchNotificationsSucceeded
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
      totalUnread: action.totalUnread || state.totalUnread,
      status: Status.SUCCESS,
      hasMore: action.hasMore,
      hasLoaded: true
    }
  },
  [actions.SET_NOTIFICATIONS](
    state: NotificationState,
    action: actions.SetNotifications
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
      totalUnread: action.totalUnread,
      status: Status.SUCCESS,
      hasMore: action.hasMore,
      hasLoaded: true
    }
  },
  [actions.SET_NOTIFICATION_USERS](
    state: NotificationState,
    action: actions.SetNotificationUsers
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
    action: actions.FetchNotificationUsersSucceeded
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
  [actions.MARK_AS_READ](state: NotificationState, action: actions.MarkAsRead) {
    return {
      ...state,
      notifications: {
        ...state.notifications,
        [action.notificationId]: {
          ...state.notifications[action.notificationId],
          isRead: true
        }
      },
      totalUnread: state.totalUnread - 1
    }
  },
  [actions.MARK_ALL_AS_READ](state: NotificationState) {
    return {
      ...state,
      notifications: Object.keys(state.notifications).reduce(
        (notifications: { [id: string]: Notification }, id: string) => {
          notifications[id] = {
            ...state.notifications[id],
            isRead: true
          }
          return notifications
        },
        {}
      ),
      totalUnread: 0
    }
  },
  [actions.HIDE_NOTIFICATION](
    state: NotificationState,
    action: actions.HideNotification
  ) {
    return {
      ...state,
      notifications: {
        ...state.notifications,
        [action.notificationId]: {
          ...state.notifications[action.notificationId],
          isHidden: true
        }
      }
    }
  },
  [actions.SET_NOTIFICATION_MODAL](
    state: NotificationState,
    action: actions.SetNotificationModal
  ) {
    return {
      ...state,
      modalIsOpen: action.open,
      modalNotificationId: action.notificationId
    }
  },
  [actions.MARK_ALL_AS_VIEWED](state: NotificationState) {
    return { ...state, totalUnread: 0 }
  },
  [actions.TOGGLE_NOTIFICATION_PANEL](state: NotificationState) {
    return { ...state, panelIsOpen: !state.panelIsOpen }
  },
  [actions.SET_PLAYLIST_UPDATES](
    state: NotificationState,
    action: actions.SetPlaylistUpdates
  ) {
    return {
      ...state,
      playlistUpdates: action.playlistUpdates || []
    }
  },
  [actions.UPDATE_PLAYLIST_VIEW](
    state: NotificationState,
    action: actions.UpdatePlaylistLastViewedAt
  ) {
    return {
      ...state,
      playlistUpdates: state.playlistUpdates.filter(
        id => id !== action.playlistId
      )
    }
  }
}

const reducer = (
  state: NotificationState = initialState,
  action: actions.NotificationAction
) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
