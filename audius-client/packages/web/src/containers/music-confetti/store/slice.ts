import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppState } from 'store/types'

type MusicConfettiState = {
  isVisible: boolean
  isMatrix: boolean
}

const initialState: MusicConfettiState = {
  isVisible: false,
  isMatrix: false
}

const slice = createSlice({
  name: 'music-confetti',
  initialState,
  reducers: {
    show: (state, action: PayloadAction<{ isMatrix: boolean }>) => {
      state.isVisible = true
      state.isMatrix = action.payload.isMatrix
    },
    hide: state => {
      state.isVisible = false
      state.isMatrix = false
    }
  }
})

export const { show, hide } = slice.actions

// Selectors

export const getIsVisible = (state: AppState) =>
  state.application.ui.musicConfetti.isVisible

export const getIsMatrix = (state: AppState) =>
  state.application.ui.musicConfetti.isMatrix

export default slice.reducer
