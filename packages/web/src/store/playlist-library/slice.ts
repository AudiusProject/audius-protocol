import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { PlaylistLibrary } from 'common/models/PlaylistLibrary'

const initialState = {}

export type UpdatePayload = {
  playlistLibrary: PlaylistLibrary
}

const slice = createSlice({
  name: 'playlist-library',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<UpdatePayload>) => {}
  }
})

export const { update } = slice.actions

export default slice.reducer
