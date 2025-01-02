import { ID } from '@audius/common/models'
import {
  cacheCollectionsActions,
  cacheCollectionsSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { SetRequired } from 'type-fest'

import { useSelector } from 'common/hooks/useSelector'
import { DeleteConfirmationModal } from 'components/delete-confirmation'
import { DeleteConfirmationModalProps } from 'components/delete-confirmation/DeleteConfirmationModal'
import useLastLocation from 'hooks/useLastLocation'

const { FEED_PAGE } = route
const { getCollection } = cacheCollectionsSelectors
const { deletePlaylist } = cacheCollectionsActions

type DeleteCollectionConfirmationModalProps = SetRequired<
  Partial<DeleteConfirmationModalProps>,
  'visible' | 'onCancel'
> & {
  collectionId: ID
}

export const DeleteCollectionConfirmationModal = (
  props: DeleteCollectionConfirmationModalProps
) => {
  const navigate = useNavigate()
  const lastLocation = useLastLocation()
  const { collectionId, visible, onCancel } = props

  const collection = useSelector((state) =>
    getCollection(state, { id: collectionId })
  )
  const { is_album, permalink } = collection ?? {}
  const dispatch = useDispatch()

  const handleDelete = () => {
    dispatch(deletePlaylist(collectionId))
    if (!lastLocation || lastLocation.pathname === permalink) {
      navigate(FEED_PAGE, { replace: true })
    } else {
      navigate(-1)
    }
  }

  return (
    <DeleteConfirmationModal
      title={`Delete ${is_album ? 'Album' : 'Playlist'}`}
      visible={visible}
      onCancel={onCancel}
      onDelete={handleDelete}
      entity={is_album ? 'Album' : 'Playlist'}
    />
  )
}
