import { lineupReducer } from '@audius/common/store'
import { createSlice } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import { PREFIX as moreByPrefix } from './lineups/more-by/actions'
import moreByTracksReducer, {
  initialState as initialLineupState
} from './lineups/more-by/reducer'
const { asLineup } = lineupReducer

type State = {}

const initialState: State = { moreBy: initialLineupState }

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
