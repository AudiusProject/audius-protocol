import type { ID, Nullable } from '@audius/common'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type BaseDrawerData = Record<string, unknown>

export type Drawer =
  | 'EnablePushNotifications'
  | 'DeactivateAccountConfirmation'
  | 'DownloadTrackProgress'
  | 'ForgotPassword'
  | 'NowPlaying'
  | 'CancelEditTrack'
  | 'DeleteConfirmation'
  | 'ConnectWallets'
  | 'ConfirmRemoveWallet'
  | 'ShareToStoryProgress'
  | 'RemoveDownloadedCollection'
  | 'RemoveDownloadedFavorites'
  | 'UnfavoriteDownloadedCollection'
  | 'RateCallToAction'
  | 'LockedContent'
  | 'ChatActions'
  | 'ProfileActions'
  | 'BlockMessages'

export type DrawerData = {
  EnablePushNotifications: undefined
  DeactivateAccountConfirmation: undefined
  DownloadTrackProgress: undefined
  ForgotPassword: undefined
  NowPlaying: undefined
  CancelEditTrack: undefined
  RateCallToAction: undefined
  DeleteConfirmation: {
    trackId: number
  }
  ConnectWallets: { uri: string }
  ConfirmRemoveWallet: undefined
  ShareToStoryProgress: undefined
  UnfavoriteDownloadedCollection: { collectionId: number }
  RemoveDownloadedFavorites: undefined
  RemoveDownloadedCollection: {
    collectionId: ID
  }
  LockedContent: undefined
  ChatActions: { userId: number }
  ProfileActions: { userId: number }
  BlockMessages: { userId: number }
}

export type DrawersState = { [drawer in Drawer]: boolean | 'closing' } & {
  data: Nullable<BaseDrawerData>
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
  ConfirmRemoveWallet: false,
  ShareToStoryProgress: false,
  RemoveDownloadedCollection: false,
  RemoveDownloadedFavorites: false,
  UnfavoriteDownloadedCollection: false,
  RateCallToAction: false,
  LockedContent: false,
  ChatActions: false,
  ProfileActions: false,
  BlockMessages: false,
  data: null
}

type SetVisibilityAction = PayloadAction<{
  drawer: Drawer
  visible: boolean | 'closing'
  data?: DrawerData[Drawer]
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
