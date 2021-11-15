import React from 'react'

import AddToPlaylistModal from 'containers/add-to-playlist/desktop/AddToPlaylistModal'
import AppCTAModal from 'containers/app-cta-modal/AppCTAModal'
import AudioBreakdownModal from 'containers/audio-rewards-page/components/modals/AudioBreakdownModal'
import RewardsModals from 'containers/audio-rewards-page/components/modals/RewardsModals'
import BrowserPushConfirmationModal from 'containers/browser-push-confirmation-modal/BrowserPushConfirmationModal'
import ConfirmAudioToWAudioModal from 'containers/confirm-audio-to-waudio/desktop/ConfirmAudioToWAudioModal'
import DeletePlaylistConfirmationModal from 'containers/delete-playlist-confirmation-modal/DeletePlaylistConfirmationModal'
import EditPlaylistModal from 'containers/edit-playlist/desktop/EditPlaylistModal'
import EditTrackModal from 'containers/edit-track/EditTrackModal'
import EmbedModal from 'containers/embed-modal/EmbedModal'
import FirstUploadModal from 'containers/first-upload-modal/FirstUploadModal'
import PasswordResetModal from 'containers/password-reset/PasswordResetModal'
import ServiceSelectionModal from 'containers/service-selection/ServiceSelectionModal'
import ShareSoundToTikTokModal from 'containers/share-sound-to-tiktok-modal/ShareSoundToTikTokModal'
import ConnectedMobileOverflowModal from 'containers/track-overflow-modal/ConnectedMobileOverflowModal'
import UnfollowConfirmationModal from 'containers/unfollow-confirmation-modal/UnfollowConfirmationModal'
import UnloadDialog from 'containers/unload-dialog/UnloadDialog'
import TierExplainerModal from 'containers/user-badges/TierExplainerModal'
import ConnectedUserListModal from 'containers/user-list-modal/ConnectedUserListModal'
import Client from 'models/Client'
import { getClient } from 'utils/clientUtil'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const Modals = () => {
  const client = getClient()
  const isMobileClient = client === Client.MOBILE

  return (
    <>
      <ServiceSelectionModal />
      <EditTrackModal />
      <PasswordResetModal />
      <FirstUploadModal />
      <UnloadDialog />
      <RewardsModals />
      <ShareSoundToTikTokModal />
      <AudioBreakdownModal />

      {!NATIVE_MOBILE && client !== Client.ELECTRON && (
        <BrowserPushConfirmationModal />
      )}

      {!isMobileClient && (
        <>
          <EmbedModal />
          <EditPlaylistModal />
          <AddToPlaylistModal />
          <ConnectedUserListModal />
          <AppCTAModal />
          <TierExplainerModal />
          <ConfirmAudioToWAudioModal />
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
