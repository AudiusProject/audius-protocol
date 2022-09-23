import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type MobileUiState = {
  androidNavigationBarHeight: number
}

const initialState: MobileUiState = {
  androidNavigationBarHeight: 0
}

const slice = createSlice({
  name: 'mobileUi',
  initialState,
  reducers: {
    setAndroidNavigationBarHeight(
      state,
      action: PayloadAction<{ androidNavigationBarHeight: number }>
    ) {
      const { androidNavigationBarHeight } = action.payload
      state.androidNavigationBarHeight = androidNavigationBarHeight
      return state
    }
  }
})

export const { setAndroidNavigationBarHeight } = slice.actions

export default slice.reducer
