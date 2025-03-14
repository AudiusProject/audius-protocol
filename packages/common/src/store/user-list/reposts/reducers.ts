import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { RepostsPageState, RepostType } from './types'

type TrackRepostActions = ActionType<typeof actions>

const initialState = {
  id: null,
  repostType: RepostType.TRACK
}

const repostsPageReducer = createReducer<RepostsPageState, TrackRepostActions>(
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

export default repostsPageReducer
