import { ComponentType } from 'react'

import { Client } from '@audius/common'
import type { Modals as ModalTypes } from '@audius/common'

import AddToPlaylistModal from 'components/add-to-playlist/desktop/AddToPlaylistModal'
import AppCTAModal from 'components/app-cta-modal/AppCTAModal'
import BrowserPushConfirmationModal from 'components/browser-push-confirmation-modal/BrowserPushConfirmationModal'
import CollectibleDetailsModal from 'components/collectibles/components/CollectibleDetailsModal'
import DeletePlaylistConfirmationModal from 'components/delete-playlist-confirmation-modal/DeletePlaylistConfirmationModal'
import EditFolderModal from 'components/edit-folder-modal/EditFolderModal'
import EditPlaylistModal from 'components/edit-playlist/desktop/EditPlaylistModal'
import EditTrackModal from 'components/edit-track/EditTrackModal'
import EmbedModal from 'components/embed-modal/EmbedModal'
import { FeatureFlagOverrideModal } from 'components/feature-flag-override-modal'
import FirstUploadModal from 'components/first-upload-modal/FirstUploadModal'
import PasswordResetModal from 'components/password-reset/PasswordResetModal'
import ServiceSelectionModal from 'components/service-selection/ServiceSelectionModal'
import { ShareModal } from 'components/share-modal/ShareModal'
import ShareSoundToTikTokModal from 'components/share-sound-to-tiktok-modal/ShareSoundToTikTokModal'
import { TipAudioModal } from 'components/tipping/tip-audio/TipAudioModal'
import ConnectedMobileOverflowModal from 'components/track-overflow-modal/ConnectedMobileOverflowModal'
import UnfollowConfirmationModal from 'components/unfollow-confirmation-modal/UnfollowConfirmationModal'
import UnloadDialog from 'components/unload-dialog/UnloadDialog'
import TierExplainerModal from 'components/user-badges/TierExplainerModal'
import ConnectedUserListModal from 'components/user-list-modal/ConnectedUserListModal'
import AudioBreakdownModal from 'pages/audio-rewards-page/components/modals/AudioBreakdownModal'
import RewardsModals from 'pages/audio-rewards-page/components/modals/RewardsModals'
import { getClient } from 'utils/clientUtil'

import { AppModal } from './AppModal'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const NATIVE_NAVIGATION_ENABLED =
  process.env.REACT_APP_NATIVE_NAVIGATION_ENABLED === 'true'

const appModalsMap = {
  Share: ShareModal
}

const appModals = Object.entries(appModalsMap) as [ModalTypes, ComponentType][]

const Modals = () => {
  const client = getClient()
  const isMobileClient = client === Client.MOBILE

  if (NATIVE_NAVIGATION_ENABLED) return null

  return (
    <>
      {appModals.map(([modalName, Modal]) => {
        return <AppModal key={modalName} name={modalName} modal={Modal} />
      })}
      <ServiceSelectionModal />
      <EditTrackModal />
      <PasswordResetModal />
      <FirstUploadModal />
      <UnloadDialog />
      <RewardsModals />
      <ShareSoundToTikTokModal />
      {/* Enable and use this audio breakdown modal until we get
      the feature flags to work for native mobile */}
      <AudioBreakdownModal />
      <CollectibleDetailsModal />

      {!NATIVE_MOBILE && client !== Client.ELECTRON && (
        <BrowserPushConfirmationModal />
      )}

      {!isMobileClient && (
        <>
          <EmbedModal />
          <EditPlaylistModal />
          <EditFolderModal />
          <AddToPlaylistModal />
          <FeatureFlagOverrideModal />
          <ConnectedUserListModal />
          <AppCTAModal />
          <TierExplainerModal />
        </>
      )}

      {isMobileClient && (
        <>
          {!NATIVE_MOBILE && <ConnectedMobileOverflowModal />}
          <UnfollowConfirmationModal />
          <DeletePlaylistConfirmationModal />
        </>
      )}

      {!NATIVE_MOBILE && <TipAudioModal />}
    </>
  )
}

export default Modals
