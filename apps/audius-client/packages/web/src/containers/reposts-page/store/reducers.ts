import { createReducer, ActionType } from 'typesafe-actions'
import * as actions from './actions'
import { RepostsOwnState, RepostType } from './types'
import { UserListReducerFactory } from 'containers/user-list/store/reducer'
import { USER_LIST_TAG } from '../RepostsPage'
import { combineReducers } from 'redux'

type TrackRepostActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer(USER_LIST_TAG)

const initialState = {
  id: null,
  repostType: RepostType.TRACK
}

const repostsPageReducer = createReducer<RepostsOwnState, TrackRepostActions>(
  initialState,
  {
    [actions.SET_REPOST](state, action) {
      return {
        ...state,
        id: action.id,
        repostType: action.repostType
      }
    }
  }
)

export default combineReducers({
  repostsPage: repostsPageReducer,
  userList: userListReducer
})
