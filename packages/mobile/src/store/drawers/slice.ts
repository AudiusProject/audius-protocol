import type { ID } from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type BaseDrawerData = Record<string, unknown>

export type Drawer =
  | 'EnablePushNotifications'
  | 'DeactivateAccountConfirmation'
  | 'ForgotPassword'
  | 'NowPlaying'
  | 'CancelEditTrack'
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
  | 'ChatActions'
  | 'CreateChatActions'
  | 'ProfileActions'
  | 'BlockMessages'
  | 'MuteComments'
  | 'DeleteChat'
  | 'SupportersInfo'
  | 'OfflineListening'
  | 'Welcome'
  | 'ManagerMode'
  | 'Comment'

export type DrawerData = {
  EnablePushNotifications: undefined
  DeactivateAccountConfirmation: undefined
  ForgotPassword: undefined
  NowPlaying: undefined
  CancelEditTrack: undefined
  RateCallToAction: undefined
  PlaybackRate: undefined
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
  ChatActions: { userId: number; chatId: string }
  CreateChatActions: { userId: number }
  ProfileActions: undefined
  BlockMessages: {
    userId: number
    shouldOpenChat: boolean
    isReportAbuse: boolean
  }
  MuteComments: { userId: number; isMuted: boolean }
  DeleteChat: { chatId: string }
  SupportersInfo: undefined
  InboxUnavailable: { userId: number; shouldOpenChat: boolean }
  Welcome: undefined
  ManagerMode: undefined
  Comment: { entityId: ID }
}

export type DrawersState = { [drawer in Drawer]: boolean | 'closing' } & {
  data: { [drawerData in Drawer]?: Nullable<DrawerData[Drawer]> }
}

const initialState: DrawersState = {
  EnablePushNotifications: false,
  DeactivateAccountConfirmation: false,
  ForgotPassword: false,
  NowPlaying: false,
  CancelEditTrack: false,
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
  ChatActions: false,
  CreateChatActions: false,
  ProfileActions: false,
  BlockMessages: false,
  MuteComments: false,
  DeleteChat: false,
  SupportersInfo: false,
  Welcome: false,
  ManagerMode: false,
  Comment: false,
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
