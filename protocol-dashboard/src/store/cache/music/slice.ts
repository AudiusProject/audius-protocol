import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Album, Playlist, Track } from 'types'

export type State = {
  topTracks: Track[] | null | MusicError
  topPlaylists: Playlist[] | null | MusicError
  topAlbums: Album[] | null | MusicError
}

export const initialState: State = {
  topTracks: null,
  topPlaylists: null,
  topAlbums: null
}

export enum MusicError {
  ERROR = 'error'
}

type SetTopTracks = { tracks: Track[] | MusicError }
type SetTopPlaylists = { playlists: Playlist[] | MusicError }
type SetTopAlbums = { albums: Album[] | MusicError }

const slice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    setTopTracks: (state, action: PayloadAction<SetTopTracks>) => {
      const { tracks } = action.payload
      state.topTracks = tracks
    },
    setTopPlaylists: (state, action: PayloadAction<SetTopPlaylists>) => {
      const { playlists } = action.payload
      state.topPlaylists = playlists
    },
    setTopAlbums: (state, action: PayloadAction<SetTopAlbums>) => {
      const { albums } = action.payload
      state.topAlbums = albums
    }
  }
})

export const { setTopTracks, setTopPlaylists, setTopAlbums } = slice.actions

export default slice.reducer
