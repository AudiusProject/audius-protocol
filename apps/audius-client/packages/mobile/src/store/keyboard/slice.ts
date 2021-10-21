import { createSlice } from '@reduxjs/toolkit'

export type KeyboardState = typeof initialState

const initialState = {
  isOpen: false
}

const slice = createSlice({
  name: 'keyboard',
  initialState,
  reducers: {
    open: state => {
      state.isOpen = true
    },
    close: state => {
      state.isOpen = false
    }
  }
})

export const { open, close } = slice.actions

export default slice.reducer
