import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { FollowingPageState } from './types'

type FollowingActions = ActionType<typeof actions>

const initialState = {
  id: null
}

const followingReducer = createReducer<FollowingPageState, FollowingActions>(
  initialState,
  {
    [actions.SET_FOLLOWING](state, action) {
      return {
        ...state,
        id: action.id
      }
    }
  }
)

export default followingReducer
