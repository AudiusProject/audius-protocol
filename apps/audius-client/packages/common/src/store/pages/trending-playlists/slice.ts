import { combineReducers, createSlice } from '@reduxjs/toolkit'

import { asLineup } from 'store/lineup/reducer'

import { PREFIX } from './lineups/actions'
import playlistsReducer from './lineups/reducer'

const initialState = {}

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
