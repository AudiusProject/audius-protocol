import { useCallback } from 'react'

import {
  Name,
  accountSelectors,
  playlistLibraryActions,
  playlistLibraryHelpers,
  playlistLibrarySelectors
} from '@audius/common'
import { ModalProps } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { useRecord, make } from 'common/store/analytics/actions'
import { DeleteConfirmationModal } from 'components/delete-confirmation'

const { selectFolder } = playlistLibrarySelectors
const { removePlaylistFolderInLibrary } = playlistLibraryHelpers
const { update: updatePlaylistLibrary } = playlistLibraryActions
const { getPlaylistLibrary } = accountSelectors

const messages = {
  confirmDeleteFolderModalTitle: 'Delete Folder',
  confirmDeleteFolderModalHeader:
    'Are you sure you want to delete this folder?',
  confirmDeleteFolderModalDescription:
    'Any playlists inside will be moved out before the folder is deleted.',
  folderEntity: 'Folder'
}

type DeleteFolderConfirmationModalProps = Pick<
  ModalProps,
  'isOpen' | 'onClose'
> & {
  folderId: string
}

export const DeleteFolderConfirmationModal = (
  props: DeleteFolderConfirmationModalProps
) => {
  const { folderId, isOpen, onClose } = props
  const folder = useSelector((state) => selectFolder(state, folderId))
  const playlistLibrary = useSelector(getPlaylistLibrary)
  const dispatch = useDispatch()
  const record = useRecord()

  const handleConfirmDelete = useCallback(() => {
    if (!playlistLibrary || !folder) return
    const newLibrary = removePlaylistFolderInLibrary(playlistLibrary, folderId)
    dispatch(updatePlaylistLibrary({ playlistLibrary: newLibrary }))

    record(make(Name.FOLDER_DELETE, {}))
    onClose()
  }, [dispatch, folder, folderId, onClose, playlistLibrary, record])

  return (
    <DeleteConfirmationModal
      customHeader={messages.confirmDeleteFolderModalHeader}
      customDescription={messages.confirmDeleteFolderModalDescription}
      title={messages.confirmDeleteFolderModalTitle}
      entity={messages.folderEntity}
      onDelete={handleConfirmDelete}
      onCancel={onClose}
      visible={isOpen}
    />
  )
}
