import { ModalSource } from 'models/Analytics'

import { AddFundsModalState } from './add-funds-modal'
import { CreateChatModalState } from './create-chat-modal'
import { BaseModalState } from './createModal'
import { EditPlaylistModalState } from './edit-playlist-modal'
import { EditTrackModalState } from './edit-track-modal'
import { InboxUnavailableModalState } from './inbox-unavailable-modal'
import { LeavingAudiusModalState } from './leaving-audius-modal'
import { PremiumContentPurchaseModalState } from './premium-content-purchase-modal'
import { USDCManualTransferModalState } from './usdc-manual-transfer-modal'
import { USDCPurchaseDetailsModalState } from './usdc-purchase-details-modal'
import { USDCTransactionDetailsModalState } from './usdc-transaction-details-modal'
import { WithdrawUSDCModalState } from './withdraw-usdc-modal'

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
  | 'FeedFilter'
  | 'PurchaseVendor'
  | 'TrendingGenreSelection'
  | 'SocialProof'
  | 'EditFolder'
  | 'EditPlaylist'
  | 'EditTrack'
  | 'SignOutConfirmation'
  | 'Overflow'
  | 'AddToPlaylist'
  | 'DeletePlaylistConfirmation'
  | 'FeatureFlagOverride'
  | 'BuyAudio'
  | 'BuyAudioRecovery'
  | 'TransactionDetails'
  | 'VipDiscord'
  | 'StripeOnRamp'
  | 'InboxSettings'
  | 'LockedContent'
  | 'PlaybackRate'
  | 'ProfileActions'
  | 'PublishPlaylistConfirmation'
  | 'AiAttributionSettings'
  | 'DuplicateAddConfirmation'
  | 'PremiumContentPurchaseModal'
  | 'CreateChatModal'
  | 'InboxUnavailableModal'
  | 'LeavingAudiusModal'
  | 'UploadConfirmation'
  | 'WithdrawUSDCModal'
  | 'USDCPurchaseDetailsModal'
  | 'USDCTransactionDetailsModal'
  | 'USDCManualTransferModal'
  | 'AddFundsModal'
  | 'Welcome'

export type BasicModalsState = {
  [modal in Modals]: BaseModalState
}

export type StatefulModalsState = {
  CreateChatModal: CreateChatModalState
  EditPlaylist: EditPlaylistModalState
  EditTrack: EditTrackModalState
  InboxUnavailableModal: InboxUnavailableModalState
  LeavingAudiusModal: LeavingAudiusModalState
  WithdrawUSDCModal: WithdrawUSDCModalState
  USDCPurchaseDetailsModal: USDCPurchaseDetailsModalState
  USDCTransactionDetailsModal: USDCTransactionDetailsModalState
  USDCManualTransferModal: USDCManualTransferModalState
  AddFundsModal: AddFundsModalState
  PremiumContentPurchaseModal: PremiumContentPurchaseModalState
}

export type ModalsState = BasicModalsState & StatefulModalsState

export type TrackModalOpenedActionPayload = {
  name: string
  source: ModalSource
  trackingData?: Record<string, any>
}

export type TrackModalClosedActionPayload = {
  name: string
}
