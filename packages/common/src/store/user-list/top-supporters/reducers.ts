import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { TopSupportersPageState } from './types'

type TopSupportersActions = ActionType<typeof actions>

const initialState = {
  id: null
}

const topSupportersReducer = createReducer<
  TopSupportersPageState,
  TopSupportersActions
>(initialState, {
  [actions.SET_TOP_SUPPORTERS](state, action) {
    return {
      ...state,
      id: action.id
    }
  }
})

export default topSupportersReducer
