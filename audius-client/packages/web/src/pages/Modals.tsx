import React from 'react'

import Client from 'common/models/Client'
import AddToPlaylistModal from 'components/add-to-playlist/desktop/AddToPlaylistModal'
import AppCTAModal from 'components/app-cta-modal/AppCTAModal'
import BrowserPushConfirmationModal from 'components/browser-push-confirmation-modal/BrowserPushConfirmationModal'
import DeletePlaylistConfirmationModal from 'components/delete-playlist-confirmation-modal/DeletePlaylistConfirmationModal'
import EditFolderModal from 'components/edit-folder-modal/EditFolderModal'
import EditPlaylistModal from 'components/edit-playlist/desktop/EditPlaylistModal'
import EditTrackModal from 'components/edit-track/EditTrackModal'
import EmbedModal from 'components/embed-modal/EmbedModal'
import FirstUploadModal from 'components/first-upload-modal/FirstUploadModal'
import PasswordResetModal from 'components/password-reset/PasswordResetModal'
import ServiceSelectionModal from 'components/service-selection/ServiceSelectionModal'
import { ShareModal } from 'components/share-modal/ShareModal'
import ShareSoundToTikTokModal from 'components/share-sound-to-tiktok-modal/ShareSoundToTikTokModal'
import ConnectedMobileOverflowModal from 'components/track-overflow-modal/ConnectedMobileOverflowModal'
import UnfollowConfirmationModal from 'components/unfollow-confirmation-modal/UnfollowConfirmationModal'
import UnloadDialog from 'components/unload-dialog/UnloadDialog'
import TierExplainerModal from 'components/user-badges/TierExplainerModal'
import ConnectedUserListModal from 'components/user-list-modal/ConnectedUserListModal'
import AudioBreakdownModal from 'pages/audio-rewards-page/components/modals/AudioBreakdownModal'
import RewardsModals from 'pages/audio-rewards-page/components/modals/RewardsModals'
import { getClient } from 'utils/clientUtil'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const NATIVE_NAVIGATION_ENABLED =
  process.env.REACT_APP_NATIVE_NAVIGATION_ENABLED === 'true'

const Modals = () => {
  const client = getClient()
  const isMobileClient = client === Client.MOBILE

  if (NATIVE_NAVIGATION_ENABLED) return null

  return (
    <>
      <ServiceSelectionModal />
      <EditTrackModal />
      <PasswordResetModal />
      <FirstUploadModal />
      <UnloadDialog />
      <RewardsModals />
      <ShareModal />
      <ShareSoundToTikTokModal />
      {/* Enable and use this audio breakdown modal until we get
      the feature flags to work for native mobile */}
      <AudioBreakdownModal />

      {!NATIVE_MOBILE && client !== Client.ELECTRON && (
        <BrowserPushConfirmationModal />
      )}

      {!isMobileClient && (
        <>
          <EmbedModal />
          <EditPlaylistModal />
          <EditFolderModal />
          <AddToPlaylistModal />
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
    </>
  )
}

export default Modals
