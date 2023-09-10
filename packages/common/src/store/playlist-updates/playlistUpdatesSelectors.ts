import { CommonState } from '..'

import { playlistUpdatesEntityAdapter } from './playlistUpdatesSlice'

export const {
  selectById: selectPlaylistUpdateById,
  selectTotal: selectPlaylistUpdatesTotal,
  selectAll: selectAllPlaylistUpdates,
  selectIds: selectAllPlaylistUpdateIds
} = playlistUpdatesEntityAdapter.getSelectors<CommonState>(
  (state) => state.playlistUpdates
)
