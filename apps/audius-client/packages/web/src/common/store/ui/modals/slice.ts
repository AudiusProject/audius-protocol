import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { CommonState } from 'common/store'

export type Modals =
  | 'TiersExplainer'
  | 'TrendingRewardsExplainer'
  | 'ChallengeRewardsExplainer'
  | 'LinkSocialRewardsExplainer'
  | 'APIRewardsExplainer'
  | 'TransferAudioMobileWarning'
  | 'MobileConnectWalletsDrawer'
  | 'MobileEditCollectiblesDrawer'
  | 'Share'
  | 'ShareSoundToTikTok'
  | 'HCaptcha'
  | 'BrowserPushPermissionConfirmation'
  | 'AudioBreakdown'
  | 'CollectibleDetails'
  | 'DeactivateAccountConfirmation'
  | 'Cognito'
  | 'FeedFilter'
  | 'TrendingGenreSelection'
  | 'SocialProof'
  | 'MobileUpload'
  | 'EditFolder'
  | 'SignOutConfirmation'
  | 'Overflow'
  | 'AddToPlaylist'
  | 'DeletePlaylistConfirmation'
  | 'FeatureFlagOverride'
  | 'BuyAudio'

export type ModalsState = { [modal in Modals]: boolean | 'closing' }

const initialState: ModalsState = {
  TiersExplainer: false,
  TrendingRewardsExplainer: false,
  ChallengeRewardsExplainer: false,
  LinkSocialRewardsExplainer: false,
  APIRewardsExplainer: false,
  TransferAudioMobileWarning: false,
  MobileConnectWalletsDrawer: false,
  MobileEditCollectiblesDrawer: false,
  Share: false,
  ShareSoundToTikTok: false,
  HCaptcha: false,
  BrowserPushPermissionConfirmation: false,
  AudioBreakdown: false,
  CollectibleDetails: false,
  DeactivateAccountConfirmation: false,
  Cognito: false,
  FeedFilter: false,
  TrendingGenreSelection: false,
  SocialProof: false,
  MobileUpload: false,
  EditFolder: false,
  SignOutConfirmation: false,
  Overflow: false,
  AddToPlaylist: false,
  DeletePlaylistConfirmation: false,
  FeatureFlagOverride: false,
  BuyAudio: false
}

const slice = createSlice({
  name: 'application/ui/modals',
  initialState,
  reducers: {
    setVisibility: (
      state,
      action: PayloadAction<{
        modal: Modals
        visible: boolean | 'closing'
      }>
    ) => {
      const { modal, visible } = action.payload
      state[modal] = visible
    }
  }
})

export const getModalVisibility = (state: CommonState, modal: Modals) =>
  state.ui.modals[modal]

export const getModalIsOpen = (state: CommonState) =>
  Object.values(state.ui.modals).some((isOpen) => isOpen)

export const { setVisibility } = slice.actions

export default slice.reducer
