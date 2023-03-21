import { playlistUpdatesEntityAdapter } from './playlistUpdatesSlice'

export const { selectById: selectPlaylistUpdateById } =
  playlistUpdatesEntityAdapter.getSelectors()
