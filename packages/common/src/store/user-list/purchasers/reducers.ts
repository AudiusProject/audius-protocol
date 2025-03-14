import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { PurchasersPageState } from './types'

type PurchasersActions = ActionType<typeof actions>

const initialState = {
  contentId: null,
  contentType: null
}

const purchasersReducer = createReducer<PurchasersPageState, PurchasersActions>(
  initialState,
  {
    [actions.SET_PURCHASERS](state, action) {
      return {
        ...state,
        contentId: action.contentId ?? null,
        contentType: action.contentType ?? null
      }
    }
  }
)

export default purchasersReducer
