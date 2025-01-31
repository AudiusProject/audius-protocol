import { useCallback } from 'react'

import { useUpdatePlaylistLibrary } from '@audius/common/api'
import { Name } from '@audius/common/models'
import {
  accountSelectors,
  playlistLibraryHelpers,
  playlistLibrarySelectors
} from '@audius/common/store'
import { SetRequired } from 'type-fest'

import { useSelector } from 'common/hooks/useSelector'
import { useRecord, make } from 'common/store/analytics/actions'
import { DeleteConfirmationModal } from 'components/delete-confirmation'
import { DeleteConfirmationModalProps } from 'components/delete-confirmation/DeleteConfirmationModal'

const { selectFolder } = playlistLibrarySelectors
const { removePlaylistFolderInLibrary } = playlistLibraryHelpers
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
  const { mutate: updatePlaylistLibrary } = useUpdatePlaylistLibrary()
  const record = useRecord()

  const handleDelete = useCallback(() => {
    if (!playlistLibrary || !folder) return
    const newLibrary = removePlaylistFolderInLibrary(playlistLibrary, folderId)
    updatePlaylistLibrary(newLibrary)

    record(make(Name.FOLDER_DELETE, {}))
    onDelete?.()
  }, [
    updatePlaylistLibrary,
    folder,
    folderId,
    onDelete,
    playlistLibrary,
    record
  ])

  return (
    <DeleteConfirmationModal
      header={messages.confirmDeleteFolderModalHeader}
      description={messages.confirmDeleteFolderModalDescription}
      title={messages.confirmDeleteFolderModalTitle}
      entity={messages.folderEntity}
      onDelete={handleDelete}
      onCancel={onCancel}
      visible={visible}
    />
  )
}
