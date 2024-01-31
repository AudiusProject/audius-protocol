import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import {
  accountSelectors,
  playlistLibraryActions,
  playlistLibraryHelpers,
  playlistLibrarySelectors
} from '@audius/common/store'
import { useDispatch } from 'react-redux'
import { SetRequired } from 'type-fest'

import { useSelector } from 'common/hooks/useSelector'
import { useRecord, make } from 'common/store/analytics/actions'
import { DeleteConfirmationModal } from 'components/delete-confirmation'
import { DeleteConfirmationModalProps } from 'components/delete-confirmation/DeleteConfirmationModal'

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

type DeleteFolderConfirmationModalProps = SetRequired<
  Partial<DeleteConfirmationModalProps>,
  'visible' | 'onCancel'
> & {
  folderId: string
}

export const DeleteFolderConfirmationModal = (
  props: DeleteFolderConfirmationModalProps
) => {
  const { folderId, visible, onCancel, onDelete } = props
  const folder = useSelector((state) => selectFolder(state, folderId))
  const playlistLibrary = useSelector(getPlaylistLibrary)
  const dispatch = useDispatch()
  const record = useRecord()

  const handleDelete = useCallback(() => {
    if (!playlistLibrary || !folder) return
    const newLibrary = removePlaylistFolderInLibrary(playlistLibrary, folderId)
    dispatch(updatePlaylistLibrary({ playlistLibrary: newLibrary }))

    record(make(Name.FOLDER_DELETE, {}))
    onDelete?.()
  }, [dispatch, folder, folderId, onDelete, playlistLibrary, record])

  return (
    <DeleteConfirmationModal
      customHeader={messages.confirmDeleteFolderModalHeader}
      customDescription={messages.confirmDeleteFolderModalDescription}
      title={messages.confirmDeleteFolderModalTitle}
      entity={messages.folderEntity}
      onDelete={handleDelete}
      onCancel={onCancel}
      visible={visible}
    />
  )
}
