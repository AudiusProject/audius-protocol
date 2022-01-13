import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import { ID } from 'common/models/Identifiers'
import { asLineup } from 'store/lineup/reducer'

import { PREFIX as remixesTracksPrefix } from './lineups/tracks/actions'
import remixesTracksReducer from './lineups/tracks/reducer'

type State = {
  trackId: ID | null
  count: number | null
}

const initialState: State = {
  trackId: null,
  count: null
}

const slice = createSlice({
  name: 'application/pages/remixes',
  initialState,
  reducers: {
    reset: state => {
      state.trackId = null
    },
    fetchTrack: (
      state,
      action: PayloadAction<{ handle: string; slug: string }>
    ) => {},
    fetchTrackSucceeded: (state, action: PayloadAction<{ trackId: ID }>) => {
      const { trackId } = action.payload
      state.trackId = trackId
    },
    setCount: (state, action: PayloadAction<{ count: number }>) => {
      const { count } = action.payload
      state.count = count
    }
  }
})

const remixesLineupReducer = asLineup(remixesTracksPrefix, remixesTracksReducer)

export const {
  reset,
  setCount,
  fetchTrack,
  fetchTrackSucceeded
} = slice.actions

export default combineReducers({
  page: slice.reducer,
  tracks: remixesLineupReducer
})
