import { useCallback } from 'react'

import { cacheCollectionsSelectors } from '@audius/common/store'
import { capitalize } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useDrawer } from 'app/hooks/useDrawer'
import { requestRemoveDownloadedCollection } from 'app/store/offline-downloads/slice'

import { ConfirmationDrawer } from './ConfirmationDrawer'
const { getCollection } = cacheCollectionsSelectors

const messages = {
  header: 'Are You Sure?',
  description: (contentType: string) =>
    `Are you sure you want to remove this ${contentType} from your device?`,
  confirm: (contentType: string) =>
    `Remove Downloaded ${capitalize(contentType)}`
}

const drawerName = 'RemoveDownloadedCollection'

export const RemoveDownloadedCollectionDrawer = () => {
  const { data } = useDrawer(drawerName)
  const { collectionId } = data
  const dispatch = useDispatch()

  const isAlbum = useSelector(
    (state) => !!getCollection(state, { id: collectionId })?.is_album
  )
  const contentType = isAlbum ? 'album' : 'playlist'

  const handleConfirm = useCallback(() => {
    dispatch(requestRemoveDownloadedCollection({ collectionId }))
  }, [dispatch, collectionId])

  return (
    <ConfirmationDrawer
      drawerName={drawerName}
      messages={{
        ...messages,
        confirm: messages.confirm(contentType),
        description: messages.description(contentType)
      }}
      onConfirm={handleConfirm}
    />
  )
}
