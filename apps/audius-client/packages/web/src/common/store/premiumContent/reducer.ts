import { ID, PremiumContentSignature } from '@audius/common'
import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { UPDATE_PREMIUM_CONTENT_SIGNATURES } from './actions'

type NFTActions = ActionType<typeof actions>

type NFTState = {
  premiumTrackSignatureMap: { [id: ID]: PremiumContentSignature }
}

const initialState = {
  premiumTrackSignatureMap: {}
}

const nftReducer = createReducer<NFTState, NFTActions>(initialState, {
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

export default nftReducer
