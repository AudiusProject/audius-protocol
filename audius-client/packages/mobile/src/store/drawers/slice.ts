import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type Drawer =
  | 'EnablePushNotifications'
  | 'DeactivateAccountConfirmation'
  | 'DownloadTrackProgress'
  | 'ForgotPassword'
  | 'NowPlaying'

export type DrawersState = { [drawer in Drawer]: boolean | 'closing' }

const initialState: DrawersState = {
  EnablePushNotifications: false,
  DeactivateAccountConfirmation: false,
  DownloadTrackProgress: false,
  ForgotPassword: false,
  NowPlaying: false
}

const slice = createSlice({
  name: 'DRAWERS',
  initialState,
  reducers: {
    setVisibility: (
      state,
      action: PayloadAction<{
        drawer: Drawer
        visible: boolean | 'closing'
      }>
    ) => {
      const { drawer, visible } = action.payload
      state[drawer] = visible
    }
  }
})

export const { setVisibility } = slice.actions

export default slice.reducer
