import { ComponentType, lazy } from 'react'

import { Client } from '@audius/common'
import type { Modals as ModalTypes } from '@audius/common'

import AddToPlaylistModal from 'components/add-to-playlist/desktop/AddToPlaylistModal'
import { AiAttributionSettingsModal } from 'components/ai-attribution-settings-modal'
import AppCTAModal from 'components/app-cta-modal/AppCTAModal'
import BrowserPushConfirmationModal from 'components/browser-push-confirmation-modal/BrowserPushConfirmationModal'
import { BuyAudioModal } from 'components/buy-audio-modal/BuyAudioModal'
import { BuyAudioRecoveryModal } from 'components/buy-audio-modal/BuyAudioRecoveryModal'
import CollectibleDetailsModal from 'components/collectibles/components/CollectibleDetailsModal'
import ConfirmerPreview from 'components/confirmer-preview/ConfirmerPreview'
import DeletePlaylistConfirmationModal from 'components/delete-playlist-confirmation-modal/DeletePlaylistConfirmationModal'
import DiscoveryNodeSelection from 'components/discovery-node-selection/DiscoveryNodeSelection'
import { DuplicateAddConfirmationModal } from 'components/duplicate-add-confirmation-modal'
import EditFolderModal from 'components/edit-folder-modal/EditFolderModal'
import EditPlaylistModal from 'components/edit-playlist/desktop/EditPlaylistModal'
import EditTrackModal from 'components/edit-track/EditTrackModal'
import EmbedModal from 'components/embed-modal/EmbedModal'
import { FeatureFlagOverrideModal } from 'components/feature-flag-override-modal'
import FirstUploadModal from 'components/first-upload-modal/FirstUploadModal'
import { InboxSettingsModal } from 'components/inbox-settings-modal/InboxSettingsModal'
import { InboxUnavailableModal } from 'components/inbox-unavailable-modal/InboxUnavailableModal'
import { LeavingAudiusModal } from 'components/leaving-audius-modal/LeavingAudiusModal'
import { LockedContentModal } from 'components/locked-content-modal/LockedContentModal'
import PasswordResetModal from 'components/password-reset/PasswordResetModal'
import { PremiumContentPurchaseModal } from 'components/premium-content-purchase-modal/PremiumContentPurchaseModal'
import { ShareModal } from 'components/share-modal/ShareModal'
import ShareSoundToTikTokModal from 'components/share-sound-to-tiktok-modal/ShareSoundToTikTokModal'
import { StripeOnRampModal } from 'components/stripe-on-ramp-modal'
import { TipAudioModal } from 'components/tipping/tip-audio/TipAudioModal'
import ConnectedMobileOverflowModal from 'components/track-overflow-modal/ConnectedMobileOverflowModal'
import { TransactionDetailsModal } from 'components/transaction-details-modal'
import UnfollowConfirmationModal from 'components/unfollow-confirmation-modal/UnfollowConfirmationModal'
import UnloadDialog from 'components/unload-dialog/UnloadDialog'
import { UploadConfirmationModal } from 'components/upload-confirmation-modal'
import TierExplainerModal from 'components/user-badges/TierExplainerModal'
import ConnectedUserListModal from 'components/user-list-modal/ConnectedUserListModal'
import { WithdrawUSDCModal } from 'components/withdraw-usdc-modal/WithdrawUSDCModal'
import AudioBreakdownModal from 'pages/audio-rewards-page/components/modals/AudioBreakdownModal'
import ChallengeRewardsModal from 'pages/audio-rewards-page/components/modals/ChallengeRewards'
import TopAPIModal from 'pages/audio-rewards-page/components/modals/TopAPI'
import TransferAudioMobileDrawer from 'pages/audio-rewards-page/components/modals/TransferAudioMobileDrawer'
import TrendingRewardsModal from 'pages/audio-rewards-page/components/modals/TrendingRewards'
import { VipDiscordModal } from 'pages/audio-rewards-page/components/modals/VipDiscordModal'
import { CreateChatModal } from 'pages/chat-page/components/CreateChatModal'
import { getClient } from 'utils/clientUtil'

import { AppModal } from './AppModal'

// const ShareModal = lazy(() => import('components/share-modal'))

const HCaptchaModal = lazy(
  () => import('pages/audio-rewards-page/components/modals/HCaptchaModal')
)

const commonModalsMap: { [Modal in ModalTypes]?: ComponentType } = {
  Share: ShareModal,
  VipDiscord: VipDiscordModal,
  AudioBreakdown: AudioBreakdownModal,
  EditFolder: EditFolderModal,
  AddToPlaylist: AddToPlaylistModal,
  TiersExplainer: TierExplainerModal,
  DeletePlaylistConfirmation: DeletePlaylistConfirmationModal,
  DuplicateAddConfirmation: DuplicateAddConfirmationModal,
  UploadConfirmation: UploadConfirmationModal,
  BuyAudio: BuyAudioModal,
  BuyAudioRecovery: BuyAudioRecoveryModal,
  TransactionDetails: TransactionDetailsModal,
  InboxSettings: InboxSettingsModal,
  LockedContent: LockedContentModal,
  HCaptcha: HCaptchaModal,
  APIRewardsExplainer: TopAPIModal,
  TrendingRewardsExplainer: TrendingRewardsModal,
  ChallengeRewardsExplainer: ChallengeRewardsModal,
  TransferAudioMobileWarning: TransferAudioMobileDrawer,
  BrowserPushPermissionConfirmation: BrowserPushConfirmationModal,
  ShareSoundToTikTok: ShareSoundToTikTokModal,
  AiAttributionSettings: AiAttributionSettingsModal,
  PremiumContentPurchase: PremiumContentPurchaseModal,
  LeavingAudiusModal,
  CreateChatModal,
  InboxUnavailableModal,
  WithdrawUSDCModal
}

const commonModals = Object.entries(commonModalsMap) as [
  ModalTypes,
  ComponentType
][]

const Modals = () => {
  const client = getClient()
  const isMobileClient = client === Client.MOBILE

  return (
    <>
      {commonModals.map(([modalName, Modal]) => {
        return <AppModal key={modalName} name={modalName} modal={Modal} />
      })}
      {/* <EditTrackModal /> */}
      <PasswordResetModal />
      <FirstUploadModal />
      <UnloadDialog />
      <CollectibleDetailsModal />
      <StripeOnRampModal />

      {!isMobileClient && (
        <>
          <EmbedModal />
          <EditPlaylistModal />
          <ConnectedUserListModal />
          <AppCTAModal />

          {/* dev-mode hot-key modals */}
          <ConfirmerPreview />
          <DiscoveryNodeSelection />
          <FeatureFlagOverrideModal />
        </>
      )}

      {isMobileClient && (
        <>
          <ConnectedMobileOverflowModal />
          <UnfollowConfirmationModal />
        </>
      )}

      <TipAudioModal />
    </>
  )
}

export default Modals
