import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ID, PremiumContentSignature, PremiumTrackStatus } from 'models'
import { Nullable } from 'utils'

type PremiumContentState = {
  premiumTrackSignatureMap: { [id: ID]: Nullable<PremiumContentSignature> }
  statusMap: { [id: ID]: PremiumTrackStatus }
  lockedContentId: Nullable<ID>
}

const initialState: PremiumContentState = {
  premiumTrackSignatureMap: {},
  statusMap: {},
  lockedContentId: null
}

type UpdatePremiumContentSignaturesPayload = {
  [id: ID]: Nullable<PremiumContentSignature>
}

type RemovePremiumContentSignaturesPayload = {
  trackIds: ID[]
}

type UpdatePremiumTrackStatusPayload = {
  trackId: ID
  status: PremiumTrackStatus
}

type UpdatePremiumTrackStatusesPayload = {
  [id: ID]: PremiumTrackStatus
}

type SetLockedContentIdPayload = {
  id: ID
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
    removePremiumContentSignatures: (
      state,
      action: PayloadAction<RemovePremiumContentSignaturesPayload>
    ) => {
      action.payload.trackIds.forEach((trackId) => {
        delete state.premiumTrackSignatureMap[trackId]
      })
    },
    updatePremiumTrackStatus: (
      state,
      action: PayloadAction<UpdatePremiumTrackStatusPayload>
    ) => {
      state.statusMap[action.payload.trackId] = action.payload.status
    },
    updatePremiumTrackStatuses: (
      state,
      action: PayloadAction<UpdatePremiumTrackStatusesPayload>
    ) => {
      state.statusMap = {
        ...state.statusMap,
        ...action.payload
      }
    },
    setLockedContentId: (
      state,
      action: PayloadAction<SetLockedContentIdPayload>
    ) => {
      state.lockedContentId = action.payload.id
    },
    resetLockedContentId: (state) => {
      state.lockedContentId = null
    }
  }
})

export const {
  updatePremiumContentSignatures,
  removePremiumContentSignatures,
  updatePremiumTrackStatus,
  updatePremiumTrackStatuses,
  setLockedContentId,
  resetLockedContentId
} = slice.actions

export const reducer = slice.reducer
export const actions = slice.actions

export default slice
