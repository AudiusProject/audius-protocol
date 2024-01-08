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
  | 'ReleaseNowConfirmation'
  | 'DeleteTrackConfirmation'
  | 'ConnectWallets'
  | 'ConfirmRemoveWallet'
  | 'ShareToStoryProgress'
  | 'RemoveAllDownloads'
  | 'RemoveDownloadedCollection'
  | 'RemoveDownloadedFavorites'
  | 'UnfavoriteDownloadedCollection'
  | 'RateCallToAction'
  | 'LockedContent'
  | 'GatedContentUploadPrompt'
  | 'ChatActions'
  | 'CreateChatActions'
  | 'ProfileActions'
  | 'BlockMessages'
  | 'DeleteChat'
  | 'SupportersInfo'
  | 'OfflineListening'
  | 'Welcome'

export type DrawerData = {
  EnablePushNotifications: undefined
  DeactivateAccountConfirmation: undefined
  DownloadTrackProgress: undefined
  ForgotPassword: undefined
  NowPlaying: undefined
  CancelEditTrack: undefined
  RateCallToAction: undefined
  PlaybackRate: undefined
  ReleaseNowConfirmation: {
    trackId: number
  }
  DeleteTrackConfirmation: {
    trackId: number
  }
  ConnectWallets: { uri: string }
  ConfirmRemoveWallet: undefined
  ShareToStoryProgress: undefined
  UnfavoriteDownloadedCollection: { collectionId: number }
  RemoveAllDownloads: undefined
  RemoveDownloadedFavorites: undefined
  OfflineListening: {
    isFavoritesMarkedForDownload: boolean
    onSaveChanges: (isFavoritesOn: boolean) => void
  }
  RemoveDownloadedCollection: {
    collectionId: ID
  }
  LockedContent: undefined
  GatedContentUploadPrompt: undefined
  ChatActions: { userId: number; chatId: string }
  CreateChatActions: { userId: number }
  ProfileActions: undefined
  BlockMessages: {
    userId: number
    shouldOpenChat: boolean
    isReportAbuse: boolean
  }
  DeleteChat: { chatId: string }
  SupportersInfo: undefined
  InboxUnavailable: { userId: number; shouldOpenChat: boolean }
  Welcome: undefined
}

export type DrawersState = { [drawer in Drawer]: boolean | 'closing' } & {
  data: { [drawerData in Drawer]?: Nullable<DrawerData[Drawer]> }
}

const initialState: DrawersState = {
  EnablePushNotifications: false,
  DeactivateAccountConfirmation: false,
  DownloadTrackProgress: false,
  ForgotPassword: false,
  NowPlaying: false,
  CancelEditTrack: false,
  ReleaseNowConfirmation: false,
  DeleteTrackConfirmation: false,
  ConnectWallets: false,
  ConfirmRemoveWallet: false,
  ShareToStoryProgress: false,
  RemoveAllDownloads: false,
  RemoveDownloadedCollection: false,
  RemoveDownloadedFavorites: false,
  OfflineListening: false,
  UnfavoriteDownloadedCollection: false,
  RateCallToAction: false,
  LockedContent: false,
  GatedContentUploadPrompt: false,
  ChatActions: false,
  CreateChatActions: false,
  ProfileActions: false,
  BlockMessages: false,
  DeleteChat: false,
  SupportersInfo: false,
  Welcome: false,
  data: {}
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
        state.data[drawer] = data
      } else if (!visible) {
        state.data[drawer] = null
      }
    }
  }
})

export const { setVisibility } = slice.actions

export default slice.reducer
