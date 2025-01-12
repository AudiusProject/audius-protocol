import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { NotificationUsersPageState } from './types'

type NotificationUsersActions = ActionType<typeof actions>

const initialState = {
  id: null
}

const notificationUsersReducer = createReducer<
  NotificationUsersPageState,
  NotificationUsersActions
>(initialState, {
  [actions.SET_NOTIFICATION_ID](state, action) {
    return {
      ...state,
      id: action.id
    }
  }
})

export default notificationUsersReducer
