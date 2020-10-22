import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Album, Playlist, Track } from 'types'

export type State = {
  topTracks: Track[] | null
  topPlaylists: Playlist[] | null
  topAlbums: Album[] | null
}

export const initialState: State = {
  topTracks: null,
  topPlaylists: null,
  topAlbums: null
}

type SetTopTracks = { tracks: Track[] }
type SetTopPlaylists = { playlists: Playlist[] }
type SetTopAlbums = { albums: Album[] }

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
