import { useCallback } from 'react'

import { useCurrentAccount } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { cacheCollectionsActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useLastLocation } from 'react-router-last-location'
import { SetRequired } from 'type-fest'

import { DeleteConfirmationModal } from 'components/delete-confirmation'
import { DeleteConfirmationModalProps } from 'components/delete-confirmation/DeleteConfirmationModal'

const { FEED_PAGE } = route
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
  const { data: accountCollection } = useCurrentAccount({
    select: (account) => account?.collections?.[collectionId]
  })
  const { is_album, permalink } = accountCollection ?? {}
  const dispatch = useDispatch()

  const handleDelete = useCallback(() => {
    dispatch(deletePlaylist(collectionId))
    onDelete?.()
    if (lastLocation?.pathname === permalink) {
      history.replace(FEED_PAGE)
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
