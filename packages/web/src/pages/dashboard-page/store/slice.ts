import { Status, Collection, ID, Track } from '@audius/common/models'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import ArtistDashboardState from './types'

const initialState: ArtistDashboardState = {
  status: Status.LOADING,
  tracksStatus: Status.IDLE,
  tracks: [],
  collections: [],
  listenData: null
}

const slice = createSlice({
  name: 'artistDashboard',
  initialState,
  reducers: {
    reset: (_state, _action) => {},
    fetch: (state, _: PayloadAction<{ offset: number; limit: number }>) => {
      state.status = Status.LOADING
    },
    fetchSucceeded: (
      state,
      {
        payload: { tracks, collections }
      }: PayloadAction<{ tracks: Track[]; collections: Collection[] }>
    ) => {
      state.tracks = tracks
      state.collections = collections
      state.status = Status.SUCCESS
    },
    fetchFailed: (state, _) => {
      state.status = Status.ERROR
    },
    fetchTracks: (
      state,
      _: PayloadAction<{ offset: number; limit: number }>
    ) => {
      state.tracksStatus = Status.LOADING
    },
    fetchTracksSucceeded: (
      state,
      { payload: { tracks } }: PayloadAction<{ tracks: Track[] }>
    ) => {
      state.tracks = tracks
      state.tracksStatus = Status.SUCCESS
    },
    fetchTracksFailed: (state, _) => {
      state.tracksStatus = Status.ERROR
    },
    fetchListenData: (
      _state,
      _action: PayloadAction<{
        trackIds: ID[]
        start: string
        end: string
        period: string
      }>
    ) => {},
    fetchListenDataSucceeded: (
      state,
      {
        payload: { listenData }
      }: PayloadAction<{ listenData: ArtistDashboardState['listenData'] }>
    ) => {
      state.listenData = listenData
    },
    fetchListenDataFailed: (state, _) => {
      state.listenData = null
    }
  }
})

export const {
  reset,
  fetch,
  fetchSucceeded,
  fetchFailed,
  fetchTracks,
  fetchTracksSucceeded,
  fetchTracksFailed,
  fetchListenData,
  fetchListenDataSucceeded,
  fetchListenDataFailed
} = slice.actions
export const actions = slice.actions
export default slice.reducer
