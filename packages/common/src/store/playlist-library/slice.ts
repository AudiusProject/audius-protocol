import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { PlaylistLibrary } from '../../models'

export type PlaylistLibraryState = {}

const initialState: PlaylistLibraryState = {}

export type UpdatePayload = {
  playlistLibrary: PlaylistLibrary
}

const slice = createSlice({
  name: 'playlist-library',
  initialState,
  reducers: {
    update: (_state, _action: PayloadAction<UpdatePayload>) => {}
  }
})

export const { update } = slice.actions
export const actions = slice.actions

export default slice.reducer
