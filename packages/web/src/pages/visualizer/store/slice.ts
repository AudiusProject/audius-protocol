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
    },
    openVisualizer: (state) => {
      state.isVisible = true
    }
  }
})

export const { toggleVisibility, closeVisualizer, openVisualizer } =
  slice.actions

export default slice.reducer
