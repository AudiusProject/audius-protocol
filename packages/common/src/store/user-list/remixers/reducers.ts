import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { RemixersPageState } from './types'

type RemixersActions = ActionType<typeof actions>

const initialState = {
  id: null
}

const remixersReducer = createReducer<RemixersPageState, RemixersActions>(
  initialState,
  {
    [actions.SET_REMIXERS](state, action) {
      return {
        ...state,
        id: action.id
      }
    }
  }
)

export default remixersReducer
