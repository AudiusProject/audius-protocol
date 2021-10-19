import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type NowPlayingState = {
  isOpen: boolean
}

const initialState: NowPlayingState = {
  isOpen: false
}

const slice = createSlice({
  name: 'ui/now-playing',
  initialState,
  reducers: {
    setIsOpen: (state, action: PayloadAction<{ isOpen: boolean }>) => {
      const { isOpen } = action.payload
      state.isOpen = isOpen
    }
  }
})

export const { setIsOpen } = slice.actions

export default slice.reducer
