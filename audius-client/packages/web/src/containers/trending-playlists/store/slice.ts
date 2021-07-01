import { combineReducers, createSlice } from '@reduxjs/toolkit'

import { asLineup } from 'store/lineup/reducer'

import { PREFIX } from './lineups/collections/actions'
import playlistsReducer from './lineups/collections/reducer'

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
