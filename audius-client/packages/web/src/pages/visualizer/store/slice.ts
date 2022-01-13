import { createSlice } from '@reduxjs/toolkit'

export type VisualizerState = {
  isVisible: boolean
}

const initialState = { isVisible: false }

const slice = createSlice({
  name: 'application/ui/visualizer',
  initialState,
  reducers: {
    toggleVisibility: (state) => {
      state.isVisible = !state.isVisible
    },
    closeVisualizer: (state) => {
      state.isVisible = false
    }
  }
})

export const {
  toggleVisibility,
  closeVisualizer
} = slice.actions

export default slice.reducer
