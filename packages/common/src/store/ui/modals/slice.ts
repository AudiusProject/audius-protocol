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
  FeedFilter: false,
  TrendingGenreSelection: false,
  SocialProof: false,
  EditFolder: false,
  SignOutConfirmation: false,
  Overflow: false,
  AddToPlaylist: false,
  DeletePlaylistConfirmation: false,
  DuplicateAddConfirmation: false,
  FeatureFlagOverride: false,
  BuyAudio: false,
  BuyAudioRecovery: false,
  TransactionDetails: false,
  VipDiscord: false,
  StripeOnRamp: false,
  CreateChat: false,
  InboxSettings: false,
  LockedContent: false,
  PlaybackRate: false,
  ProfileActions: false,
  PublishPlaylistConfirmation: false,
  AiAttributionSettings: false,
  PremiumContentPurchase: false
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
