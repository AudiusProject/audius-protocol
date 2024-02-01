import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import { asLineup } from '~/store/lineup/reducer'

import { ID } from '../../../models/Identifiers'

import { PREFIX as remixesTracksPrefix } from './lineup/actions'
import remixesTracksReducer, {
  initialState as initialLineupState
} from './lineup/reducer'

type State = {
  trackId: ID | null
  count: number | null
  tracks: typeof initialLineupState
}

const initialState: State = {
  trackId: null,
  count: null,
  tracks: initialLineupState
}

const slice = createSlice({
  name: 'application/pages/remixes',
  initialState,
  reducers: {
    reset: (state) => {
      state.trackId = null
    },
    fetchTrack: (
      _state,
      _action: PayloadAction<{
        handle?: string
        slug?: string
        id?: ID
      }>
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

export const { reset, setCount, fetchTrack, fetchTrackSucceeded } =
  slice.actions

export default combineReducers({
  page: slice.reducer,
  tracks: remixesLineupReducer
})

export const actions = slice.actions
