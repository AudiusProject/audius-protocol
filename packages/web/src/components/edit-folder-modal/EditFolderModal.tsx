import React, { useCallback } from 'react'

import {
  IconFolder,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { PlaylistLibraryFolder } from 'common/models/PlaylistLibrary'
import { getPlaylistLibrary } from 'common/store/account/selectors'
import FolderForm from 'components/create-playlist/FolderForm'
import { getFolderId } from 'store/application/ui/editFolderModal/selectors'
import { setFolderId } from 'store/application/ui/editFolderModal/slice'
import { renamePlaylistFolderInLibrary } from 'store/playlist-library/helpers'
import { update as updatePlaylistLibrary } from 'store/playlist-library/slice'
import { useSelector } from 'utils/reducer'
import { zIndex } from 'utils/zIndex'

import styles from './EditFolderModal.module.css'

const messages = {
  editPlaylistFolderModalTitle: 'Edit Folder'
}

const EditFolderModal = () => {
  const folderId = useSelector(getFolderId)
  const playlistLibrary = useSelector(getPlaylistLibrary)
  const [isOpen, setIsOpen] = useModalState('EditFolder')
  const folder =
    playlistLibrary == null || folderId == null
      ? null
      : (playlistLibrary.contents.find(
          item => item.type === 'folder' && item.id === folderId
        ) as PlaylistLibraryFolder | undefined)

  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    dispatch(setFolderId(null))
    setIsOpen(false)
  }, [dispatch, setIsOpen])

  const handleSubmit = useCallback(
    (newName: string) => {
      if (playlistLibrary == null || folderId == null || folder == null) return
      if (newName !== folder.name) {
        const newLibrary = renamePlaylistFolderInLibrary(
          playlistLibrary,
          folderId,
          newName
        )
        dispatch(updatePlaylistLibrary({ playlistLibrary: newLibrary }))
      }
      handleClose()
    },
    [dispatch, folder, folderId, handleClose, playlistLibrary]
  )

  return (
    <Modal
      modalKey='editfolder'
      isOpen={isOpen}
      onClose={handleClose}
      zIndex={zIndex.CREATE_PLAYLIST_MODAL}
      bodyClassName={styles.modalBody}
    >
      <ModalHeader onClose={handleClose}>
        <ModalTitle
          icon={<IconFolder />}
          title={messages.editPlaylistFolderModalTitle}
        />
      </ModalHeader>
      <ModalContent>
        <FolderForm
          isEditMode
          onSubmit={handleSubmit}
          onCancel={handleClose}
          onDelete={() => {}}
          initialFolderName={folder?.name}
        />
      </ModalContent>
    </Modal>
  )
}

export default EditFolderModal
