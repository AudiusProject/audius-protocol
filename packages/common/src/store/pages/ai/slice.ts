import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import { asLineup } from '~/store/lineup/reducer'

import { PREFIX as aiTracksPrefix } from './lineup/actions'
import aiTracksReducer, {
  initialState as initialLineupState
} from './lineup/reducer'

export type AiPageState = {
  handle: string | null
  tracks: typeof initialLineupState
}

const initialState: AiPageState = {
  handle: null,
  tracks: initialLineupState
}

const slice = createSlice({
  name: 'application/pages/ai',
  initialState,
  reducers: {
    setHandle: (state, action: PayloadAction<{ handle: string }>) => {
      const { handle } = action.payload
      state.handle = handle
    }
  }
})

const aiLineupReducer = asLineup(aiTracksPrefix, aiTracksReducer)

export const { setHandle } = slice.actions

export default combineReducers({
  page: slice.reducer,
  tracks: aiLineupReducer
})

export const actions = slice.actions
