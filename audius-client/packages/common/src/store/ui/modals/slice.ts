import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Modals, ModalsState } from './types'

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
  BuyAudio: false,
  TransactionDetails: false
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

export const { setVisibility } = slice.actions

export const actions = slice.actions

export default slice.reducer
