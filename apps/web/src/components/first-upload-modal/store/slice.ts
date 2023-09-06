import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type FirstUploadModalState = {
  isOpen: boolean
}

const initialState: FirstUploadModalState = {
  isOpen: false
}

const slice = createSlice({
  name: 'application/ui/firstUploadModal',
  initialState,
  reducers: {
    setVisibility: (state, action: PayloadAction<{ isOpen: boolean }>) => {
      const { isOpen } = action.payload
      state.isOpen = isOpen
    },
    openWithDelay: (state, action: PayloadAction<{ delay: number }>) => {}
  }
})

export const { setVisibility, openWithDelay } = slice.actions

export default slice.reducer
