import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ID, PremiumContentSignature } from 'models'
import { Nullable } from 'utils'

type PremiumTrackStatus = null | 'UNLOCKING' | 'UNLOCKED' | 'LOCKED'

type PremiumContentState = {
  premiumTrackSignatureMap: { [id: ID]: Nullable<PremiumContentSignature> }
  status: PremiumTrackStatus
}

const initialState: PremiumContentState = {
  premiumTrackSignatureMap: {},
  status: null
}

type UpdatePremiumContentSignaturesPayload = {
  [id: ID]: Nullable<PremiumContentSignature>
}

type RemovePremiumContentSignaturePayload = {
  trackId: ID
}

type UpdatePremiumTrackStatusPayload = {
  status: PremiumTrackStatus
}

type RefreshPremiumTrackPayload = {
  trackId: ID
  trackParams:
    | { slug: string; trackId: null; handle: string }
    | { slug: null; trackId: ID; handle: null }
    | null
}

const slice = createSlice({
  name: 'premiumContent',
  initialState,
  reducers: {
    updatePremiumContentSignatures: (
      state,
      action: PayloadAction<UpdatePremiumContentSignaturesPayload>
    ) => {
      state.premiumTrackSignatureMap = {
        ...state.premiumTrackSignatureMap,
        ...action.payload
      }
    },
    removePremiumContentSignature: (state, action: PayloadAction<RemovePremiumContentSignaturePayload>) => {
      delete state.premiumTrackSignatureMap[action.payload.trackId]
    },
    updatePremiumTrackStatus: (state, action: PayloadAction<UpdatePremiumTrackStatusPayload>) => {
      state.status = action.payload.status
    },
    refreshPremiumTrack: (
      _,
      __: PayloadAction<RefreshPremiumTrackPayload>
    ) => {}
  }
})

export const {
  updatePremiumContentSignatures,
  updatePremiumTrackStatus,
  refreshPremiumTrack
} = slice.actions

export const reducer = slice.reducer
export const actions = slice.actions

export default slice
