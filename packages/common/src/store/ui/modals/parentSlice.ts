import type { ChallengeName } from '@audius/common/src/models/AudioRewards'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import {
  Modals,
  ModalsState,
  TrackModalClosedActionPayload,
  TrackModalOpenedActionPayload
} from './types'

export const initialState: ModalsState = {
  TiersExplainer: { isOpen: false },
  TrendingRewardsExplainer: { isOpen: false },
  ChallengeRewards: { isOpen: false, challengeName: undefined },
  ClaimAllRewards: { isOpen: false },
  LinkSocialRewardsExplainer: { isOpen: false },
  APIRewardsExplainer: { isOpen: false },
  TransferAudioMobileWarning: { isOpen: false },
  MobileConnectWalletsDrawer: { isOpen: false },
  MobileEditCollectiblesDrawer: { isOpen: false },
  Share: { isOpen: false },
  HCaptcha: { isOpen: false },
  BrowserPushPermissionConfirmation: { isOpen: false },
  AudioBreakdown: { isOpen: false },
  CollectibleDetails: { isOpen: false },
  DeactivateAccountConfirmation: { isOpen: false },
  FeedFilter: { isOpen: false },
  PurchaseVendor: { isOpen: false },
  TrendingGenreSelection: { isOpen: false },
  SocialProof: { isOpen: false },
  EditFolder: { isOpen: false },
  EditTrack: { isOpen: false },
  SignOutConfirmation: { isOpen: false },
  Overflow: { isOpen: false },
  AddToCollection: { isOpen: false },
  DeletePlaylistConfirmation: { isOpen: false },
  DeleteTrackConfirmation: { isOpen: false },
  DuplicateAddConfirmation: { isOpen: false },
  FeatureFlagOverride: { isOpen: false },
  BuyAudio: { isOpen: false },
  BuyAudioRecovery: { isOpen: false },
  TransactionDetails: { isOpen: false },
  VipDiscord: { isOpen: false },
  StripeOnRamp: { isOpen: false },
  InboxSettings: { isOpen: false },
  CommentSettings: { isOpen: false },
  PrivateKeyExporter: { isOpen: false },
  LockedContent: { isOpen: false },
  PlaybackRate: { isOpen: false },
  ProfileActions: { isOpen: false },
  PublishContentModal: { isOpen: false },
  AiAttributionSettings: { isOpen: false },
  PremiumContentPurchaseModal: { isOpen: false },
  CreateChatModal: { isOpen: false },
  ChatBlastModal: { isOpen: false },
  InboxUnavailableModal: { isOpen: false },
  LeavingAudiusModal: { isOpen: false },
  UploadConfirmation: { isOpen: false },
  EditAccessConfirmation: { isOpen: false },
  EarlyReleaseConfirmation: { isOpen: false },
  PublishConfirmation: { isOpen: false },
  HideContentConfirmation: { isOpen: false },
  WithdrawUSDCModal: { isOpen: false },
  USDCPurchaseDetailsModal: { isOpen: false },
  USDCTransactionDetailsModal: { isOpen: false },
  USDCManualTransferModal: { isOpen: false },
  AddFundsModal: { isOpen: false },
  Welcome: { isOpen: false },
  CoinflowWithdraw: { isOpen: false },
  WaitForDownloadModal: { isOpen: false },
  ArtistPick: { isOpen: false },
  AlbumTrackRemoveConfirmation: { isOpen: false },
  PayoutWallet: { isOpen: false },
  EditTrackFormOverflowMenu: { isOpen: false },
  ExternalWalletSignUp: { isOpen: false },
  Announcement: { isOpen: false },
  Notification: { isOpen: false }
}

const slice = createSlice({
  name: 'modals',
  initialState,
  reducers: {
    setVisibility: (
      state,
      action: PayloadAction<{
        modal: Modals
        visible: boolean | 'closing'
        challengeName?: ChallengeName
      }>
    ) => {
      const { modal, visible, challengeName } = action.payload
      if (modal === 'ChallengeRewards') {
        state[modal] = { isOpen: visible, challengeName }
      } else {
        state[modal] = { isOpen: visible }
      }
    },
    trackModalOpened: (
      _state,
      _action: PayloadAction<TrackModalOpenedActionPayload>
    ) => {},
    trackModalClosed: (
      _state,
      _action: PayloadAction<TrackModalClosedActionPayload>
    ) => {}
  }
})

export const { actions } = slice
export default slice.reducer
