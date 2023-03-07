import * as actions from './actions'
import * as types from './types'
import { NotificationState } from './types'

const initialState: NotificationState = {
  panelIsOpen: false,
  modalNotificationId: undefined,
  modalIsOpen: false,
  playlistUpdates: []
}

const actionsMap: any = {
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
