import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ID, PremiumContentSignature, PremiumTrackStatus } from 'models'
import { Nullable } from 'utils'

type PremiumContentState = {
  premiumTrackSignatureMap: { [id: ID]: Nullable<PremiumContentSignature> }
  statusMap: { [id: ID]: PremiumTrackStatus }
  lockedContentId: Nullable<ID>
  purchaseContentId: Nullable<ID>
  followeeIds: ID[]
  tippedUserIds: ID[]
}

const initialState: PremiumContentState = {
  premiumTrackSignatureMap: {},
  statusMap: {},
  lockedContentId: null,
  purchaseContentId: null,
  followeeIds: [],
  tippedUserIds: []
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

type IdPayload = {
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
    setLockedContentId: (state, action: PayloadAction<IdPayload>) => {
      state.lockedContentId = action.payload.id
    },
    resetLockedContentId: (state) => {
      state.lockedContentId = null
    },
    setPurchaseContentId: (state, action: PayloadAction<IdPayload>) => {
      state.purchaseContentId = action.payload.id
    },
    resetPurchaseContentId: (state) => {
      state.purchaseContentId = null
    },
    addFolloweeId: (state, action: PayloadAction<IdPayload>) => {
      state.followeeIds.push(action.payload.id)
    },
    removeFolloweeId: (state, action: PayloadAction<IdPayload>) => {
      state.followeeIds = state.followeeIds.filter(
        (id) => id !== action.payload.id
      )
    },
    addTippedUserId: (state, action: PayloadAction<IdPayload>) => {
      state.tippedUserIds.push(action.payload.id)
    },
    removeTippedUserId: (state, action: PayloadAction<IdPayload>) => {
      state.tippedUserIds = state.tippedUserIds.filter(
        (id) => id !== action.payload.id
      )
    }
  }
})

export const {
  updatePremiumContentSignatures,
  removePremiumContentSignatures,
  updatePremiumTrackStatus,
  updatePremiumTrackStatuses,
  setLockedContentId,
  resetLockedContentId,
  addFolloweeId,
  removeFolloweeId,
  addTippedUserId,
  removeTippedUserId
} = slice.actions

export const actions = slice.actions
export default slice.reducer
