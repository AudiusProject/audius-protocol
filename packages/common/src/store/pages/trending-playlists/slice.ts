import { combineReducers, createSlice } from '@reduxjs/toolkit'

import { asLineup } from '~/store/lineup/reducer'

import { PREFIX } from './lineups/actions'
import playlistsReducer, {
  initialState as initialLineupState
} from './lineups/reducer'

const initialState = {
  trending: initialLineupState
}

const slice = createSlice({
  name: 'application/pages/trendingPlaylists',
  initialState,
  reducers: {}
})

const trendingPlaylistsLineupReducer = asLineup(PREFIX, playlistsReducer)

export default combineReducers({
  page: slice.reducer,
  trending: trendingPlaylistsLineupReducer
})
