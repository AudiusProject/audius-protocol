import { ID, Nullable } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type DeletePlaylistConfirmationState = {
  playlistId: Nullable<ID>
}

export type OpenPayload = PayloadAction<{ playlistId: ID }>

const initialState: DeletePlaylistConfirmationState = {
  playlistId: null
}

const slice = createSlice({
  name: 'applications/ui/deletePlaylistConfirmation',
  initialState,
  reducers: {
    requestOpen: (state, action: OpenPayload) => {},
    open: (state, action: OpenPayload) => {
      state.playlistId = action.payload.playlistId
    }
  }
})

export const { open, requestOpen } = slice.actions

export default slice.reducer
