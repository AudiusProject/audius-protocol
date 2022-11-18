import { ID, PremiumContentSignature } from 'models'
import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { UPDATE_PREMIUM_CONTENT_SIGNATURES } from './actions'

type PremiumContentActions = ActionType<typeof actions>

type PremiumContentState = {
  premiumTrackSignatureMap: { [id: ID]: PremiumContentSignature }
}

const initialState = {
  premiumTrackSignatureMap: {}
}

const premiumContentReducer = createReducer<PremiumContentState, PremiumContentActions>(initialState, {
  [UPDATE_PREMIUM_CONTENT_SIGNATURES](state, action) {
    return {
      ...state,
      premiumTrackSignatureMap: {
        ...state.premiumTrackSignatureMap,
        ...action.signatureMap
      }
    }
  }
})

export default premiumContentReducer
