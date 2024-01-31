import { useCallback } from 'react'

import { ID } from '@audius/common/models'
import {
  cacheCollectionsActions,
  cacheCollectionsSelectors
} from '@audius/common/store'
import { useDispatch } from 'react-redux'
import { SetRequired } from 'type-fest'

import { useSelector } from 'common/hooks/useSelector'
import { DeleteConfirmationModal } from 'components/delete-confirmation'
import { DeleteConfirmationModalProps } from 'components/delete-confirmation/DeleteConfirmationModal'

const { getCollection } = cacheCollectionsSelectors
const { deletePlaylist } = cacheCollectionsActions

const messages = {
  edit: 'Edit',
  delete: 'Delete',
  title: {
    playlist: 'Playlist',
    album: 'Album'
  },
  type: {
    playlist: 'Playlist',
    album: 'Album'
  }
}

type DeleteCollectionConfirmationModalProps = SetRequired<
  Partial<DeleteConfirmationModalProps>,
  'visible' | 'onCancel'
> & {
  collectionId: ID
}

export const DeleteCollectionConfirmationModal = (
  props: DeleteCollectionConfirmationModalProps
) => {
  const { collectionId, visible, onCancel, onDelete } = props
  const isAlbum = useSelector(
    (state) => getCollection(state, { id: collectionId })?.is_album
  )
  const dispatch = useDispatch()

  const handleDelete = useCallback(() => {
    dispatch(deletePlaylist(collectionId))
    onDelete?.()
  }, [dispatch, collectionId, onDelete])

  return (
    <DeleteConfirmationModal
      title={`${messages.delete} ${
        isAlbum ? messages.title.album : messages.title.playlist
      }`}
      entity={isAlbum ? messages.type.album : messages.type.playlist}
      visible={visible}
      onCancel={onCancel}
      onDelete={handleDelete}
    />
  )
}
