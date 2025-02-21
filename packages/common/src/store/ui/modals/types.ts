import type { ChallengeName } from '@audius/common/src/models/AudioRewards'
import { Action } from '@reduxjs/toolkit'

import { ModalSource } from '~/models/Analytics'

export type BaseModalState = {
  isOpen: boolean | 'closing'
}

export type ChallengeRewardsModalState = BaseModalState & {
  challengeName?: ChallengeName
}

export type CreateChatModalState = {
  defaultUserList?: 'followers' | 'chats'
  presetMessage?: string
  onCancelAction?: Action
}

export type Modals =
  | 'TiersExplainer'
  | 'TrendingRewardsExplainer'
  | 'ChallengeRewards'
  | 'ClaimAllRewards'
  | 'LinkSocialRewardsExplainer'
  | 'APIRewardsExplainer'
  | 'TransferAudioMobileWarning'
  | 'MobileConnectWalletsDrawer'
  | 'MobileEditCollectiblesDrawer'
  | 'Share'
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
  | 'EditTrack'
  | 'SignOutConfirmation'
  | 'Overflow'
  | 'AddToCollection'
  | 'DeletePlaylistConfirmation'
  | 'DeleteTrackConfirmation'
  | 'DuplicateAddConfirmation'
  | 'FeatureFlagOverride'
  | 'BuyAudio'
  | 'BuyAudioRecovery'
  | 'TransactionDetails'
  | 'VipDiscord'
  | 'StripeOnRamp'
  | 'InboxSettings'
  | 'CommentSettings'
  | 'PrivateKeyExporter'
  | 'LockedContent'
  | 'PlaybackRate'
  | 'ProfileActions'
  | 'PublishContentModal'
  | 'AiAttributionSettings'
  | 'PremiumContentPurchaseModal'
  | 'CreateChatModal'
  | 'ChatBlastModal'
  | 'InboxUnavailableModal'
  | 'LeavingAudiusModal'
  | 'UploadConfirmation'
  | 'EditAccessConfirmation'
  | 'EarlyReleaseConfirmation'
  | 'PublishConfirmation'
  | 'HideContentConfirmation'
  | 'WithdrawUSDCModal'
  | 'USDCPurchaseDetailsModal'
  | 'USDCTransactionDetailsModal'
  | 'USDCManualTransferModal'
  | 'AddFundsModal'
  | 'Welcome'
  | 'CoinflowWithdraw'
  | 'WaitForDownloadModal'
  | 'ArtistPick'
  | 'AlbumTrackRemoveConfirmation'
  | 'PayoutWallet'
  | 'EditTrackFormOverflowMenu'
  | 'ExternalWalletSignUp'
  | 'Announcement'
  | 'Notification'

export type ModalsState = {
  [key in Modals]: key extends 'ChallengeRewards'
    ? ChallengeRewardsModalState
    : BaseModalState
}

export type TrackModalOpenedActionPayload = {
  source: ModalSource
  modal: Modals
}

export type TrackModalClosedActionPayload = {
  source: ModalSource
  modal: Modals
}
