import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState = {
  isOpen: false
}

const slice = createSlice({
  name: 'application/ui/appCTAModal',
  initialState,
  reducers: {
    setVisibility: (state, action: PayloadAction<{ isOpen: boolean }>) => {
      const { isOpen } = action.payload
      state.isOpen = isOpen
    }
  }
})

export const { setVisibility } = slice.actions

export default slice.reducer
