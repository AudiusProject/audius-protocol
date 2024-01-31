import { combineReducers, createSlice } from '@reduxjs/toolkit'

import { asLineup } from '~/store/lineup/reducer'

import { PREFIX } from './lineup/actions'
import premiumTracksReducer, {
  initialState as initialLineupState
} from './lineup/reducer'

const initialState = { tracks: initialLineupState }

const slice = createSlice({
  name: 'application/pages/premiumTracks',
  initialState,
  reducers: {}
})

const premiumTracksLineupReducer = asLineup(PREFIX, premiumTracksReducer)

export default combineReducers({
  page: slice.reducer,
  tracks: premiumTracksLineupReducer
})
