import { useCallback } from 'react'

import {
  ID,
  cacheCollectionsActions,
  cacheCollectionsSelectors
} from '@audius/common'
import { ModalProps } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { DeleteConfirmationModal } from 'components/delete-confirmation'

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

type DeleteCollectionConfirmationModalProps = Pick<
  ModalProps,
  'isOpen' | 'onClose'
> & {
  collectionId: ID
}

export const DeleteCollectionConfirmationModal = (
  props: DeleteCollectionConfirmationModalProps
) => {
  const { collectionId, isOpen, onClose } = props
  const isAlbum = useSelector(
    (state) => getCollection(state, { id: collectionId })?.is_album
  )
  const dispatch = useDispatch()

  const handleDelete = useCallback(() => {
    dispatch(deletePlaylist(collectionId))
    onClose()
  }, [dispatch, collectionId, onClose])

  return (
    <DeleteConfirmationModal
      title={`${messages.delete} ${
        isAlbum ? messages.title.album : messages.title.playlist
      }`}
      entity={isAlbum ? messages.type.album : messages.type.playlist}
      visible={isOpen}
      onDelete={handleDelete}
      onCancel={onClose}
    />
  )
}
