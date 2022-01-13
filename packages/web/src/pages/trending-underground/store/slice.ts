import { combineReducers, createSlice } from '@reduxjs/toolkit'

import { asLineup } from 'store/lineup/reducer'

import { PREFIX } from './lineups/tracks/actions'
import trendingReducer from './lineups/tracks/reducer'

const initialState = {}

const slice = createSlice({
  name: 'application/pages/trendingUnderground',
  initialState,
  reducers: {}
})

const trendingUndergroundLineupReducer = asLineup(PREFIX, trendingReducer)

export default combineReducers({
  page: slice.reducer,
  trending: trendingUndergroundLineupReducer
})
