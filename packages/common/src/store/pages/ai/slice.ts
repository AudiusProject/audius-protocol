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

export type FetchAiUserAction = PayloadAction<{
  handle?: string
  userId?: ID
}>

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
    },
    fetchAiUser: (state, action: FetchAiUserAction) => {
      const { handle, userId } = action.payload
      state.status = Status.LOADING
      if (handle) {
        state.handle = handle
      }
      if (userId) {
        state.userId = userId
      }
    },
    fetchAiUserSucceeded: (state, action: PayloadAction<{ userId: ID }>) => {
      const { userId } = action.payload
      state.userId = userId
      state.status = Status.SUCCESS
    },
    fetchAiUserFailed: (state) => {
      state.status = Status.ERROR
    },
    setCount: (state, action: PayloadAction<{ count: number }>) => {
      const { count } = action.payload
      state.count = count
    }
  }
})

const aiLineupReducer = asLineup(aiTracksPrefix, aiTracksReducer)

export const { reset, setCount, fetchAiUser, fetchAiUserSucceeded } =
  slice.actions

export default combineReducers({
  page: slice.reducer,
  tracks: aiLineupReducer
})

export const actions = slice.actions
