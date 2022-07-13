import { useCallback, useState } from 'react'

import {
  IconFolder,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { Name } from 'common/models/Analytics'
import { PlaylistLibraryFolder } from 'common/models/PlaylistLibrary'
import { getPlaylistLibrary } from 'common/store/account/selectors'
import {
  removePlaylistFolderInLibrary,
  renamePlaylistFolderInLibrary
} from 'common/store/playlist-library/helpers'
import FolderForm from 'components/create-playlist/FolderForm'
import DeleteConfirmationModal from 'components/delete-confirmation/DeleteConfirmationModal'
import { make, useRecord } from 'store/analytics/actions'
import { getFolderId } from 'store/application/ui/editFolderModal/selectors'
import { setFolderId } from 'store/application/ui/editFolderModal/slice'
import { update as updatePlaylistLibrary } from 'store/playlist-library/slice'
import { useSelector } from 'utils/reducer'
import { zIndex } from 'utils/zIndex'

import styles from './EditFolderModal.module.css'

const messages = {
  editFolderModalTitle: 'Edit Folder',
  confirmDeleteFolderModalTitle: 'Delete Folder',
  confirmDeleteFolderModalHeader:
    'Are you sure you want to delete this folder?',
  confirmDeleteFolderModalDescription:
    'Any playlists inside will be moved out before the folder is deleted.',
  folderEntity: 'Folder'
}

const EditFolderModal = () => {
  const record = useRecord()
  const folderId = useSelector(getFolderId)
  const playlistLibrary = useSelector(getPlaylistLibrary)
  const [isOpen, setIsOpen] = useModalState('EditFolder')
  const folder =
    playlistLibrary == null || folderId == null
      ? null
      : (playlistLibrary.contents.find(
          (item) => item.type === 'folder' && item.id === folderId
        ) as PlaylistLibraryFolder | undefined)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const onCancelDelete = () => setShowDeleteConfirmation(false)

  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    dispatch(setFolderId(null))
    setIsOpen(false)
  }, [dispatch, setIsOpen])

  const handleClickCancel = useCallback(() => {
    record(make(Name.FOLDER_CANCEL_EDIT, {}))
    handleClose()
  }, [handleClose, record])

  const handleSubmit = useCallback(
    (newName: string) => {
      if (
        !(playlistLibrary == null || folderId == null || folder == null) &&
        newName !== folder.name
      ) {
        const newLibrary = renamePlaylistFolderInLibrary(
          playlistLibrary,
          folderId,
          newName
        )
        dispatch(updatePlaylistLibrary({ playlistLibrary: newLibrary }))
      }
      record(make(Name.FOLDER_SUBMIT_EDIT, {}))
      handleClose()
    },
    [dispatch, folder, folderId, handleClose, playlistLibrary, record]
  )

  const handleClickDelete = useCallback(() => {
    setShowDeleteConfirmation(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!(playlistLibrary == null || folderId == null || folder == null)) {
      const newLibrary = removePlaylistFolderInLibrary(
        playlistLibrary,
        folderId
      )
      setShowDeleteConfirmation(false)
      dispatch(updatePlaylistLibrary({ playlistLibrary: newLibrary }))
    }
    record(make(Name.FOLDER_DELETE, {}))
    handleClose()
  }, [dispatch, folder, folderId, handleClose, playlistLibrary, record])

  return (
    <>
      <Modal
        modalKey='editfolder'
        isOpen={isOpen}
        onClose={handleClose}
        zIndex={zIndex.EDIT_PLAYLIST_MODAL}
        bodyClassName={styles.modalBody}>
        <ModalHeader onClose={handleClose}>
          <ModalTitle
            icon={<IconFolder />}
            title={messages.editFolderModalTitle}
          />
        </ModalHeader>
        <ModalContent>
          <FolderForm
            isEditMode
            onSubmit={handleSubmit}
            onCancel={handleClickCancel}
            onDelete={handleClickDelete}
            initialFolderName={folder?.name}
          />
        </ModalContent>
      </Modal>
      <DeleteConfirmationModal
        customHeader={messages.confirmDeleteFolderModalHeader}
        customDescription={messages.confirmDeleteFolderModalDescription}
        title={messages.confirmDeleteFolderModalTitle}
        entity={messages.folderEntity}
        visible={showDeleteConfirmation}
        onDelete={handleConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  )
}

export default EditFolderModal
