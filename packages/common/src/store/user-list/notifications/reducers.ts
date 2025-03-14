import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { NotificationUsersPageState } from './types'

type NotificationUsersActions = ActionType<typeof actions>

const initialState = {
  notification: null
}

const notificationUsersReducer = createReducer<
  NotificationUsersPageState,
  NotificationUsersActions
>(initialState, {
  [actions.SET_NOTIFICATION](state, action) {
    return {
      ...state,
      notification: action.notification
    }
  }
})

export default notificationUsersReducer
