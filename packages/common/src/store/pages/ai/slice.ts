import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

import { Status } from '~/models/Status'
import { asLineup } from '~/store/lineup/reducer'

import { ID } from '../../../models/Identifiers'

import { PREFIX as aiTracksPrefix } from './lineup/actions'
import aiTracksReducer, {
  initialState as initialLineupState
} from './lineup/reducer'

export type AiPageState = {
  userId: ID | null
  handle: string | null
  status: Status
  count: number | null
  tracks: typeof initialLineupState
}

const initialState: AiPageState = {
  userId: null,
  handle: null,
  status: Status.IDLE,
  count: null,
  tracks: initialLineupState
}

const slice = createSlice({
  name: 'application/pages/ai',
  initialState,
  reducers: {
    reset: (state) => {
      state.userId = null
      state.handle = null
      state.status = Status.IDLE
    },
    setCount: (state, action: PayloadAction<{ count: number }>) => {
      const { count } = action.payload
      state.count = count
    }
  }
})

const aiLineupReducer = asLineup(aiTracksPrefix, aiTracksReducer)

export const { reset, setCount } = slice.actions

export default combineReducers({
  page: slice.reducer,
  tracks: aiLineupReducer
})

export const actions = slice.actions
