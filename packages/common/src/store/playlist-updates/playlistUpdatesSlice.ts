import { createEntityAdapter, createSlice } from '@reduxjs/toolkit'

import {
  PlaylistUpdate,
  PlaylistUpdatesReceivedAction,
  PlaylistUpdateState,
  UpdatedPlaylistViewedAction
} from './types'

export const playlistUpdatesEntityAdapter = createEntityAdapter<PlaylistUpdate>(
  {
    selectId: (playlistUpdate) => playlistUpdate.playlist_id
  }
)

const initialState: PlaylistUpdateState =
  playlistUpdatesEntityAdapter.getInitialState()

const slice = createSlice({
  name: 'playlist-updates',
  initialState,
  reducers: {
    fetchPlaylistUpdates() {},
    playlistUpdatesReceived(state, action: PlaylistUpdatesReceivedAction) {
      playlistUpdatesEntityAdapter.setAll(state, action.payload.playlistUpdates)
    },
    updatedPlaylistViewed(state, action: UpdatedPlaylistViewedAction) {
      playlistUpdatesEntityAdapter.removeOne(state, action.payload.playlistId)
    }
  }
})

export const {
  fetchPlaylistUpdates,
  playlistUpdatesReceived,
  updatedPlaylistViewed
} = slice.actions

export const { actions } = slice
export default slice.reducer
