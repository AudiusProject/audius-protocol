import { ComponentType, lazy } from 'react'

import { Modals as ModalTypes } from '@audius/common/store'

import { AddFundsModal } from 'components/add-funds-modal/AddFundsModal'
import AddToCollectionModal from 'components/add-to-collection/desktop/AddToCollectionModal'
import { AiAttributionSettingsModal } from 'components/ai-attribution-settings-modal'
import { AlbumTrackRemoveConfirmationModal } from 'components/album-track-remove-confirmation-modal/AlbumTrackRemoveConfirmationModal'
import AppCTAModal from 'components/app-cta-modal/AppCTAModal'
import { ArtistPickModal } from 'components/artist-pick-modal/ArtistPickModal'
import BrowserPushConfirmationModal from 'components/browser-push-confirmation-modal/BrowserPushConfirmationModal'
import { BuyAudioModal } from 'components/buy-audio-modal/BuyAudioModal'
import { BuyAudioRecoveryModal } from 'components/buy-audio-modal/BuyAudioRecoveryModal'
import CoinflowOnrampModal from 'components/coinflow-onramp-modal'
import CollectibleDetailsModal from 'components/collectibles/components/CollectibleDetailsModal'
import ConfirmerPreview from 'components/confirmer-preview/ConfirmerPreview'
import DeletePlaylistConfirmationModal from 'components/delete-playlist-confirmation-modal/DeletePlaylistConfirmationModal'
import { DeleteTrackConfirmationModal } from 'components/delete-track-confirmation-modal/DeleteTrackConfirmationModal'
import DiscoveryNodeSelection from 'components/discovery-node-selection/DiscoveryNodeSelection'
import { DuplicateAddConfirmationModal } from 'components/duplicate-add-confirmation-modal'
import { EarlyReleaseConfirmationModal } from 'components/early-release-confirmation-modal'
import { EditAccessConfirmationModal } from 'components/edit-access-confirmation-modal'
import EditFolderModal from 'components/edit-folder-modal/EditFolderModal'
import EmbedModal from 'components/embed-modal/EmbedModal'
import { FeatureFlagOverrideModal } from 'components/feature-flag-override-modal'
import FirstUploadModal from 'components/first-upload-modal/FirstUploadModal'
import { HideContentConfirmationModal } from 'components/hide-confirmation-modal'
import { InboxUnavailableModal } from 'components/inbox-unavailable-modal/InboxUnavailableModal'
import { LeavingAudiusModal } from 'components/leaving-audius-modal/LeavingAudiusModal'
import { LockedContentModal } from 'components/locked-content-modal/LockedContentModal'
import { PasswordResetModal } from 'components/password-reset/PasswordResetModal'
import { PayoutWalletModal } from 'components/payout-wallet-modal/PayoutWalletModal'
import { PremiumContentPurchaseModal } from 'components/premium-content-purchase-modal/PremiumContentPurchaseModal'
import { PublishConfirmationModal } from 'components/publish-confirmation-modal/PublishConfirmationModal'
import { ReplaceTrackConfirmationModal } from 'components/replace-track-confirmation-modal/ReplaceTrackConfirmationModal'
import { ReplaceTrackProgressModal } from 'components/replace-track-progress-modal/ReplaceTrackProgressModal'
import { ClaimAllRewardsModal } from 'components/rewards/modals/ClaimAllRewardsModal'
import TopAPIModal from 'components/rewards/modals/TopAPI'
import { VipDiscordModal } from 'components/rewards/modals/VipDiscordModal'
import { TipAudioModal } from 'components/tipping/tip-audio/TipAudioModal'
import ConnectedMobileOverflowModal from 'components/track-overflow-modal/ConnectedMobileOverflowModal'
import { TransactionDetailsModal } from 'components/transaction-details-modal'
import UnfollowConfirmationModal from 'components/unfollow-confirmation-modal/UnfollowConfirmationModal'
import { UnloadDialog } from 'components/unload-dialog/UnloadDialog'
import { UploadConfirmationModal } from 'components/upload-confirmation-modal'
import { USDCPurchaseDetailsModal } from 'components/usdc-purchase-details-modal/USDCPurchaseDetailsModal'
import { USDCTransactionDetailsModal } from 'components/usdc-transaction-details-modal/USDCTransactionDetailsModal'
import TierExplainerModal from 'components/user-badges/TierExplainerModal'
import ConnectedUserListModal from 'components/user-list-modal/ConnectedUserListModal'
import { WaitForDownloadModal } from 'components/wait-for-download-modal/WaitForDownloadModal'
import { WelcomeModal } from 'components/welcome-modal/WelcomeModal'
import { WithdrawUSDCModal } from 'components/withdraw-usdc-modal/WithdrawUSDCModal'
import { CoinflowWithdrawModal } from 'components/withdraw-usdc-modal/components/CoinflowWithdrawModal'
import { useIsMobile } from 'hooks/useIsMobile'
import AudioBreakdownModal from 'pages/audio-page/components/modals/AudioBreakdownModal'
import { ChallengeRewardsModal } from 'pages/audio-page/components/modals/ChallengeRewardsModal'
import TransferAudioMobileDrawer from 'pages/audio-page/components/modals/TransferAudioMobileDrawer'
import { ChatBlastModal } from 'pages/chat-page/components/ChatBlastModal'

import { AppModal } from './AppModal'

const ShareModal = lazy(() => import('components/share-modal'))

const StripeOnRampModal = lazy(() => import('components/stripe-on-ramp-modal'))

const CreateChatModal = lazy(
  () => import('pages/chat-page/components/CreateChatModal')
)

const TrendingRewardsModal = lazy(
  () => import('components/rewards/modals/TrendingRewards')
)

const InboxSettingsModal = lazy(
  () => import('components/inbox-settings-modal/InboxSettingsModal')
)

const CommentSettingsModal = lazy(
  () => import('components/comment-settings-modal/CommentSettingsModal')
)

const commonModalsMap: { [Modal in ModalTypes]?: ComponentType } = {
  Share: ShareModal,
  VipDiscord: VipDiscordModal,
  EditFolder: EditFolderModal,
  AddToCollection: AddToCollectionModal,
  TiersExplainer: TierExplainerModal,
  DeletePlaylistConfirmation: DeletePlaylistConfirmationModal,
  DeleteTrackConfirmation: DeleteTrackConfirmationModal,
  ReplaceTrackConfirmation: ReplaceTrackConfirmationModal,
  ReplaceTrackProgress: ReplaceTrackProgressModal,
  DuplicateAddConfirmation: DuplicateAddConfirmationModal,
  AudioBreakdown: AudioBreakdownModal,
  UploadConfirmation: UploadConfirmationModal,
  EditAccessConfirmation: EditAccessConfirmationModal,
  EarlyReleaseConfirmation: EarlyReleaseConfirmationModal,
  PublishConfirmation: PublishConfirmationModal,
  HideContentConfirmation: HideContentConfirmationModal,
  AlbumTrackRemoveConfirmation: AlbumTrackRemoveConfirmationModal,
  BuyAudio: BuyAudioModal,
  BuyAudioRecovery: BuyAudioRecoveryModal,
  TransactionDetails: TransactionDetailsModal,
  InboxSettings: InboxSettingsModal,
  CommentSettings: CommentSettingsModal,
  LockedContent: LockedContentModal,
  APIRewardsExplainer: TopAPIModal,
  TrendingRewardsExplainer: TrendingRewardsModal,
  ChallengeRewardsExplainer: ChallengeRewardsModal,
  ClaimAllRewards: ClaimAllRewardsModal,
  TransferAudioMobileWarning: TransferAudioMobileDrawer,
  BrowserPushPermissionConfirmation: BrowserPushConfirmationModal,
  AiAttributionSettings: AiAttributionSettingsModal,
  Welcome: WelcomeModal,
  PremiumContentPurchaseModal,
  LeavingAudiusModal,
  CreateChatModal,
  ChatBlastModal,
  InboxUnavailableModal,
  WithdrawUSDCModal,
  CoinflowOnramp: CoinflowOnrampModal,
  StripeOnRamp: StripeOnRampModal,
  USDCPurchaseDetailsModal,
  USDCTransactionDetailsModal,
  AddFundsModal,
  CoinflowWithdraw: CoinflowWithdrawModal,
  WaitForDownloadModal,
  ArtistPick: ArtistPickModal,
  PayoutWallet: PayoutWalletModal
}

const commonModals = Object.entries(commonModalsMap) as [
  ModalTypes,
  ComponentType
][]

const Modals = () => {
  const isMobile = useIsMobile()

  return (
    <>
      <PasswordResetModal />
      <FirstUploadModal />
      <UnloadDialog />
      <CollectibleDetailsModal />
      {commonModals.map(([modalName, Modal]) => {
        return <AppModal key={modalName} name={modalName} modal={Modal} />
      })}
      {isMobile ? (
        <>
          <ConnectedMobileOverflowModal />
          <UnfollowConfirmationModal />
        </>
      ) : (
        <>
          <EmbedModal />
          <ConnectedUserListModal />
          <AppCTAModal />
          {/* dev-mode hot-key modals */}
          <ConfirmerPreview />
          <DiscoveryNodeSelection />
          <FeatureFlagOverrideModal />
        </>
      )}
      <TipAudioModal />
    </>
  )
}

export default Modals
