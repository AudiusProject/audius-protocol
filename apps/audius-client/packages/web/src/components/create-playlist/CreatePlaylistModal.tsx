import React, { useCallback, useEffect, useState } from 'react'

import {
  Modal,
  SegmentedControl,
  ModalHeader,
  ModalContent,
  ModalTitle,
  IconFolder,
  IconPlaylists
} from '@audius/stems'

import { FeatureFlags } from 'common/services/remote-config'
import { useFlag } from 'hooks/useRemoteConfig'
import zIndex from 'utils/zIndex'

import styles from './CreatePlaylistModal.module.css'
import FolderForm from './FolderForm'
import PlaylistForm from './PlaylistForm'

const messages = {
  createPlaylistTabTitle: 'Create Playlist',
  createFolderTabTitle: 'Create Folder'
}

type TabName = 'create-playlist' | 'create-folder'
const INITIAL_TAB = 'create-playlist' as TabName

type CreatePlaylistModalProps = {
  visible?: boolean
  onCancel: () => void
  onCreatePlaylist: () => void
}

const CreatePlaylistModal = ({
  visible = true,
  onCancel,
  onCreatePlaylist
}: CreatePlaylistModalProps) => {
  const { isEnabled: isPlaylistFoldersEnabled } = useFlag(
    FeatureFlags.PLAYLIST_FOLDERS
  )

  const tabOptions = [
    {
      key: 'create-playlist',
      text: messages.createPlaylistTabTitle
    },
    {
      key: 'create-folder',
      text: messages.createFolderTabTitle
    }
  ] as Array<{ key: TabName; text: string }>

  const [currentTabName, setCurrentTabName] = useState(INITIAL_TAB)

  useEffect(() => {
    if (!visible) {
      setCurrentTabName(INITIAL_TAB)
    }
  }, [visible])

  const [isArtworkPopupOpen, setIsArtworkPopupOpen] = useState(false)

  const onOpenArtworkPopup = useCallback(() => {
    setIsArtworkPopupOpen(true)
  }, [setIsArtworkPopupOpen])

  const onCloseArtworkPopup = useCallback(() => {
    setIsArtworkPopupOpen(false)
  }, [setIsArtworkPopupOpen])

  const handleSelectTabOption = useCallback(
    (key: string) => {
      setCurrentTabName(key as TabName)
    },
    [setCurrentTabName]
  )

  return (
    <Modal
      modalKey='createplaylist'
      dismissOnClickOutside={!isArtworkPopupOpen}
      bodyClassName={styles.modalBody}
      isOpen={visible}
      onClose={onCancel}
      zIndex={zIndex.CREATE_PLAYLIST_MODAL}
    >
      <ModalHeader onClose={onCancel}>
        <ModalTitle
          icon={
            currentTabName === 'create-playlist' ? (
              <IconPlaylists />
            ) : (
              <IconFolder />
            )
          }
          title={
            currentTabName === 'create-playlist'
              ? messages.createPlaylistTabTitle
              : messages.createFolderTabTitle
          }
        />
      </ModalHeader>
      <ModalContent>
        {!isPlaylistFoldersEnabled ? null : (
          <div className={styles.segmentedControlContainer}>
            <SegmentedControl
              options={tabOptions}
              selected={currentTabName}
              onSelectOption={handleSelectTabOption}
            />
          </div>
        )}
        {currentTabName === 'create-playlist' ? (
          <PlaylistForm
            onOpenArtworkPopup={onOpenArtworkPopup}
            onCloseArtworkPopup={onCloseArtworkPopup}
            onSave={onCreatePlaylist}
          />
        ) : (
          <FolderForm onSubmit={() => {}} />
        )}
      </ModalContent>
    </Modal>
  )
}

export default CreatePlaylistModal
