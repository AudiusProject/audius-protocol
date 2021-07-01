import { createReducer, ActionType } from 'typesafe-actions'

import { MessageType } from 'services/native-mobile-interface/types'

import * as actions from './actions'
import { NowPlayingState } from './types'

const initialState = {
  isCasting: false
}

type Actions = ActionType<typeof actions>

const reducer = createReducer<NowPlayingState, Actions>(initialState, {
  [MessageType.IS_CASTING](state, action) {
    return {
      ...state,
      isCasting: action.isCasting
    }
  }
})

export default reducer
