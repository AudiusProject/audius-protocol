import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Nullable } from '~/utils/typeUtils'

import { ID } from '../../../models/Identifiers'

type PublishPlaylistConfirmationState = {
  playlistId: Nullable<ID>
}

export type OpenPayload = PayloadAction<{ playlistId: ID }>

const initialState: PublishPlaylistConfirmationState = {
  playlistId: null
}

const slice = createSlice({
  name: 'applications/ui/publishPlaylistConfirmation',
  initialState,
  reducers: {
    requestOpen: (_state, _action: OpenPayload) => {},
    open: (state, action: OpenPayload) => {
      state.playlistId = action.payload.playlistId
    }
  }
})

export const { open, requestOpen } = slice.actions
export const actions = slice.actions
export default slice.reducer
