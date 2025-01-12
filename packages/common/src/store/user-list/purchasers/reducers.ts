import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { PurchasersPageState } from './types'

type PurchasersActions = ActionType<typeof actions>

const initialState = {
  id: null,
  contentType: undefined,
  contentId: undefined
}

const purchasersReducer = createReducer<PurchasersPageState, PurchasersActions>(
  initialState,
  {
    [actions.SET_PURCHASERS](state, action) {
      return {
        ...state,
        id: action.id,
        contentType: action.contentType,
        contentId: action.contentId
      }
    }
  }
)

export default purchasersReducer
