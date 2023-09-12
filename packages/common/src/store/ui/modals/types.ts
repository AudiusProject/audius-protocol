import { CreateChatModalState } from './create-chat-modal'
import { BaseModalState } from './createModal'
import { EditPlaylistModalState } from './edit-playlist-modal'
import { InboxUnavailableModalState } from './inbox-unavailable-modal'
import { LeavingAudiusModalState } from './leaving-audius-modal'
import { USDCPurchaseDetailsModalState } from './usdc-purchase-details-modal'
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
  | 'TrendingGenreSelection'
  | 'SocialProof'
  | 'EditFolder'
  | 'EditPlaylist'
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
  | 'PremiumContentPurchase'
  | 'CreateChatModal'
  | 'InboxUnavailableModal'
  | 'LeavingAudiusModal'
  | 'UploadConfirmation'
  | 'WithdrawUSDCModal'
  | 'USDCPurchaseDetailsModal'

export type BasicModalsState = {
  [modal in Modals]: BaseModalState
}

export type StatefulModalsState = {
  CreateChatModal: CreateChatModalState
  EditPlaylist: EditPlaylistModalState
  InboxUnavailableModal: InboxUnavailableModalState
  LeavingAudiusModal: LeavingAudiusModalState
  WithdrawUSDCModal: WithdrawUSDCModalState
  USDCPurchaseDetailsModal: USDCPurchaseDetailsModalState
}

export type ModalsState = BasicModalsState & StatefulModalsState
