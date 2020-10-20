import { createSlice } from '@reduxjs/toolkit'

type MusicConfettiState = {
  isVisible: boolean
}

const initialState: MusicConfettiState = {
  isVisible: false
}

const slice = createSlice({
  name: 'music-confetti',
  initialState,
  reducers: {
    show: state => {
      state.isVisible = true
    },
    hide: state => {
      state.isVisible = false
    }
  }
})

export const { show, hide } = slice.actions

export default slice.reducer
