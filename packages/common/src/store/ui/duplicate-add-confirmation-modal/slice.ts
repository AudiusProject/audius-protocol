import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Nullable } from '~/utils/typeUtils'

import { ID } from '../../../models/Identifiers'

type DuplicateAddConfirmationState = {
  playlistId: Nullable<ID>
  trackId: Nullable<ID>
}

export type OpenPayload = PayloadAction<{ playlistId: ID; trackId: ID }>

const initialState: DuplicateAddConfirmationState = {
  trackId: null,
  playlistId: null
}

const slice = createSlice({
  name: 'applications/ui/duplicateAddConfirmation',
  initialState,
  reducers: {
    requestOpen: (_state, _action: OpenPayload) => {},
    open: (state, action: OpenPayload) => {
      state.playlistId = action.payload.playlistId
      state.trackId = action.payload.trackId
    }
  }
})

export const { open, requestOpen } = slice.actions
export const actions = slice.actions
export default slice.reducer
