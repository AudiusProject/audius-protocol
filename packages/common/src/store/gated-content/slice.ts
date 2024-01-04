import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ID, AccessSignature, GatedTrackStatus } from 'models'
import { Nullable } from 'utils'

type GatedContentState = {
  nftAccessSignatureMap: { [id: ID]: Nullable<AccessSignature> }
  statusMap: { [id: ID]: GatedTrackStatus }
  lockedContentId: Nullable<ID>
  followeeIds: ID[]
  tippedUserIds: ID[]
}

const initialState: GatedContentState = {
  nftAccessSignatureMap: {},
  statusMap: {},
  lockedContentId: null,
  followeeIds: [],
  tippedUserIds: []
}

type UpdateNftAccessSignaturesPayload = {
  [id: ID]: Nullable<AccessSignature>
}

type RevokeAccessPayload = {
  trackIds: ID[]
}

type UpdateGatedTrackStatusPayload = {
  trackId: ID
  status: GatedTrackStatus
}

type UpdateGatedTrackStatusesPayload = {
  [id: ID]: GatedTrackStatus
}

type IdPayload = {
  id: ID
}

const slice = createSlice({
  name: 'gatedContent',
  initialState,
  reducers: {
    updateNftAccessSignatures: (
      state,
      action: PayloadAction<UpdateNftAccessSignaturesPayload>
    ) => {
      state.nftAccessSignatureMap = {
        ...state.nftAccessSignatureMap,
        ...action.payload
      }
    },
    revokeAccess: (_state, __action: PayloadAction<RevokeAccessPayload>) => {
      // triggers saga
    },
    updateGatedTrackStatus: (
      state,
      action: PayloadAction<UpdateGatedTrackStatusPayload>
    ) => {
      state.statusMap[action.payload.trackId] = action.payload.status
    },
    updateGatedTrackStatuses: (
      state,
      action: PayloadAction<UpdateGatedTrackStatusesPayload>
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
  updateNftAccessSignatures,
  revokeAccess,
  updateGatedTrackStatus,
  updateGatedTrackStatuses,
  setLockedContentId,
  resetLockedContentId,
  addFolloweeId,
  removeFolloweeId,
  addTippedUserId,
  removeTippedUserId
} = slice.actions

export const actions = slice.actions
export default slice.reducer
