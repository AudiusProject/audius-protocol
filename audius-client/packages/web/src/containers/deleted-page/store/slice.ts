import { combineReducers } from 'redux'

import { createSlice } from '@reduxjs/toolkit'
import moreByTracksReducer from './lineups/more-by/reducer'
import { PREFIX as moreByPrefix } from './lineups/more-by/actions'
import { asLineup } from 'store/lineup/reducer'

type State = {}

const initialState: State = {}

const slice = createSlice({
  name: 'application/pages/remixes',
  initialState,
  reducers: {}
})

const moreByLineupReducer = asLineup(moreByPrefix, moreByTracksReducer)

export default combineReducers({
  page: slice.reducer,
  moreBy: moreByLineupReducer
})
