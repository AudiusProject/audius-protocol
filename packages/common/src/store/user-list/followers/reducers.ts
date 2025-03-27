import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { FollowersPageState } from './types'

type FollowersActions = ActionType<typeof actions>

const initialState = {
  id: null
}

const followersReducer = createReducer<FollowersPageState, FollowersActions>(
  initialState,
  {
    [actions.SET_FOLLOWERS](state, action) {
      return {
        ...state,
        id: action.id
      }
    }
  }
)

export default followersReducer
