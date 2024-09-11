import { useCallback } from 'react'

import { ID } from '@audius/common/models'
import {
  cacheCollectionsActions,
  cacheCollectionsSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useLastLocation } from 'react-router-last-location'
import { SetRequired } from 'type-fest'

import { useSelector } from 'common/hooks/useSelector'
import { DeleteConfirmationModal } from 'components/delete-confirmation'
import { DeleteConfirmationModalProps } from 'components/delete-confirmation/DeleteConfirmationModal'

const { FEED_PAGE } = route
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
  const history = useHistory()
  const lastLocation = useLastLocation()
  const { collectionId, visible, onCancel, onDelete } = props
  const collection = useSelector((state) =>
    getCollection(state, { id: collectionId })
  )
  const { is_album, permalink } = collection ?? {}
  const dispatch = useDispatch()

  const handleDelete = useCallback(() => {
    dispatch(deletePlaylist(collectionId))
    onDelete?.()
    if (!lastLocation || lastLocation.pathname === permalink) {
      history.replace(FEED_PAGE)
    } else {
      history.goBack()
    }
  }, [dispatch, collectionId, onDelete, lastLocation, permalink, history])

  return (
    <DeleteConfirmationModal
      title={`${messages.delete} ${
        is_album ? messages.title.album : messages.title.playlist
      }`}
      entity={is_album ? messages.type.album : messages.type.playlist}
      visible={visible}
      onCancel={onCancel}
      onDelete={handleDelete}
    />
  )
}
