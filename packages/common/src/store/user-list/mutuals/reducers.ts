import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { MutualsPageState } from './types'

type MutualsActions = ActionType<typeof actions>

const initialState = {
  id: null
}

const mutualsReducer = createReducer<MutualsPageState, MutualsActions>(
  initialState,
  {
    [actions.SET_MUTUALS](state, action) {
      return {
        ...state,
        id: action.id
      }
    }
  }
)

export default mutualsReducer
