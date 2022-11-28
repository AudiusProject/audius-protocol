import type { Nullable } from '@audius/common'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type DrawerData = Record<string, unknown>

export type Drawer =
  | 'EnablePushNotifications'
  | 'DeactivateAccountConfirmation'
  | 'DownloadTrackProgress'
  | 'ForgotPassword'
  | 'NowPlaying'
  | 'CancelEditTrack'
  | 'DeleteConfirmation'
  | 'ConnectWallets'

export type DrawersState = { [drawer in Drawer]: boolean | 'closing' } & {
  data: Nullable<DrawerData>
}

const initialState: DrawersState = {
  EnablePushNotifications: false,
  DeactivateAccountConfirmation: false,
  DownloadTrackProgress: false,
  ForgotPassword: false,
  NowPlaying: false,
  CancelEditTrack: false,
  DeleteConfirmation: false,
  ConnectWallets: false,
  data: null
}

type SetVisibilityAction = PayloadAction<{
  drawer: Drawer
  visible: boolean | 'closing'
  data?: DrawerData
}>

const slice = createSlice({
  name: 'DRAWERS',
  initialState,
  reducers: {
    setVisibility: (state, action: SetVisibilityAction) => {
      const { drawer, visible, data } = action.payload
      state[drawer] = visible
      if (visible && data) {
        state.data = data
      } else if (!visible) {
        state.data = null
      }
    }
  }
})

export const { setVisibility } = slice.actions

export default slice.reducer
