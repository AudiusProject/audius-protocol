import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { SupportingPageState } from './types'

type SupportingActions = ActionType<typeof actions>

const initialState = {
  id: null
}

const supportingReducer = createReducer<SupportingPageState, SupportingActions>(
  initialState,
  {
    [actions.SET_SUPPORTING](state, action) {
      return {
        ...state,
        id: action.id
      }
    }
  }
)

export default supportingReducer
