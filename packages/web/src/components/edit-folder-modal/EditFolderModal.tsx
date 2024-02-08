import { useCallback, useState } from 'react'

import { Name, PlaylistLibraryFolder } from '@audius/common/models'
import {
  accountSelectors,
  playlistLibraryActions,
  playlistLibraryHelpers
} from '@audius/common/store'
import { IconFolder } from '@audius/harmony'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { make, useRecord } from 'common/store/analytics/actions'
import FolderForm from 'components/create-playlist/FolderForm'
import { DeleteFolderConfirmationModal } from 'components/nav/desktop/PlaylistLibrary/DeleteFolderConfirmationModal'
import { getFolderId } from 'store/application/ui/editFolderModal/selectors'
import { setFolderId } from 'store/application/ui/editFolderModal/slice'
import { useSelector } from 'utils/reducer'
import { zIndex } from 'utils/zIndex'

import styles from './EditFolderModal.module.css'
const { update: updatePlaylistLibrary } = playlistLibraryActions
const { renamePlaylistFolderInLibrary } = playlistLibraryHelpers
const { getPlaylistLibrary } = accountSelectors

const messages = {
  editFolderModalTitle: 'Edit Folder',
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
  const onCloseDeleteConfirmation = () => setShowDeleteConfirmation(false)

  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    dispatch(setFolderId(null))
    setIsOpen(false)
  }, [dispatch, setIsOpen])

  const handleCancel = useCallback(() => {
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

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteConfirmation(true)
  }, [])

  const handleDelete = useCallback(() => {
    setShowDeleteConfirmation(false)
    handleClose()
  }, [handleClose])

  return (
    <>
      <Modal
        modalKey='editfolder'
        isOpen={isOpen}
        onClose={handleClose}
        zIndex={zIndex.EDIT_PLAYLIST_MODAL}
        bodyClassName={styles.modalBody}
      >
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
            onCancel={handleCancel}
            onDelete={handleConfirmDelete}
            initialFolderName={folder?.name}
          />
        </ModalContent>
      </Modal>
      {folder ? (
        <DeleteFolderConfirmationModal
          folderId={folder.id}
          visible={showDeleteConfirmation}
          onCancel={onCloseDeleteConfirmation}
          onDelete={handleDelete}
        />
      ) : null}
    </>
  )
}

export default EditFolderModal
