import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ID, StreamingSignature, GatedTrackStatus } from 'models'
import { Nullable } from 'utils'

type GatedContentState = {
  gatedTrackSignatureMap: { [id: ID]: Nullable<StreamingSignature> }
  statusMap: { [id: ID]: GatedTrackStatus }
  lockedContentId: Nullable<ID>
  followeeIds: ID[]
  tippedUserIds: ID[]
}

const initialState: GatedContentState = {
  gatedTrackSignatureMap: {},
  statusMap: {},
  lockedContentId: null,
  followeeIds: [],
  tippedUserIds: []
}

type UpdateStreamingSignaturesPayload = {
  [id: ID]: Nullable<StreamingSignature>
}

type RemoveStreamingSignaturesPayload = {
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
    updateStreamingSignatures: (
      state,
      action: PayloadAction<UpdateStreamingSignaturesPayload>
    ) => {
      state.gatedTrackSignatureMap = {
        ...state.gatedTrackSignatureMap,
        ...action.payload
      }
    },
    removeStreamingSignatures: (
      state,
      action: PayloadAction<RemoveStreamingSignaturesPayload>
    ) => {
      action.payload.trackIds.forEach((trackId) => {
        delete state.gatedTrackSignatureMap[trackId]
      })
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
  updateStreamingSignatures,
  removeStreamingSignatures,
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
