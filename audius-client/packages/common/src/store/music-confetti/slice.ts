import { createSlice } from '@reduxjs/toolkit'

export type MusicConfettiState = {
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

export const actions = slice.actions
export default slice.reducer
