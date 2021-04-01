import { Status } from '../../types/status'
import { Notification } from './types'
import {
  NotificationsActions,
  OPEN,
  CLOSE,
  APPEND,
  REPLACE,
  MARK_AS_VIEWED,
  SET_STATUS
} from './actions'

export type NotificationsState = {
  isOpen: boolean
  status: Status
  notifications: Notification[]
  endReached: boolean
}

const initialState = {
  isOpen: false,
  status: Status.LOADING,
  notifications: [],
  endReached: false
}

const reducer = (
  state: NotificationsState = initialState,
  action: NotificationsActions
) => {
  switch (action.type) {
    case OPEN:
      return {
        ...state,
        isOpen: true
      }
    case CLOSE:
      return {
        ...state,
        isOpen: false
      }
    case APPEND:
      return {
        ...state,
        status: action.status,
        endReached: action.notifications.length === 0,
        notifications: [...state.notifications, ...action.notifications]
      }
    case REPLACE:
      return {
        ...state,
        status: action.status,
        notifications: action.notifications
      }
    case MARK_AS_VIEWED: {
      const newNotifications = state.notifications.map(notif => ({
        ...notif,
        isViewed: true
      }))
      return {
        ...state,
        notifications: newNotifications
      }
    }
    case SET_STATUS:
      return {
        ...state,
        status: action.status
      }
    default:
      return state
  }
}

export default reducer
