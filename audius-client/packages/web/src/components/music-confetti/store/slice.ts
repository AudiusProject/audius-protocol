import { createSlice } from '@reduxjs/toolkit'

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
    show: (state) => {
      state.isVisible = true
    },
    hide: (state) => {
      state.isVisible = false
    }
  }
})

export const { show, hide } = slice.actions

// Selectors

export const getIsVisible = (state: AppState) =>
  state.application.ui.musicConfetti.isVisible

export default slice.reducer
