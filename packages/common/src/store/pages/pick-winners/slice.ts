import { createSlice } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import { asLineup } from '~/store/lineup/reducer'

import { ID } from '../../../models/Identifiers'

import { PREFIX as pickWinnersTracksPrefix } from './lineup/actions'
import pickWinnersTracksReducer, {
  initialState as initialLineupState
} from './lineup/reducer'

type State = {
  trackId: ID | null
  tracks: typeof initialLineupState
}

const initialState: State = {
  trackId: null,
  tracks: initialLineupState
}

const slice = createSlice({
  name: 'application/pages/pick-winners',
  initialState,
  reducers: {}
})

const pickWinnersLineupReducer = asLineup(
  pickWinnersTracksPrefix,
  pickWinnersTracksReducer
)

export default combineReducers({
  page: slice.reducer,
  tracks: pickWinnersLineupReducer
})

export const actions = slice.actions
