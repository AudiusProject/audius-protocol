import { cacheCollectionsSelectors } from '@audius/common/store'
import { useCallback } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { useDrawer } from 'app/hooks/useDrawer'
import { requestRemoveDownloadedCollection } from 'app/store/offline-downloads/slice'

import { ConfirmationDrawer } from './ConfirmationDrawer'
const { getCollection } = cacheCollectionsSelectors

const messages = {
  header: 'Are You Sure?',
  description: (isAlbum: boolean) =>
    `Are you sure you want to remove this ${
      isAlbum ? 'album' : 'playlist'
    } from your device?`,
  confirm: 'Remove Downloaded Playlist'
}

const drawerName = 'RemoveDownloadedCollection'

export const RemoveDownloadedCollectionDrawer = () => {
  const { data } = useDrawer(drawerName)
  const { collectionId } = data
  const dispatch = useDispatch()

  const isAlbum = useSelector(
    (state) => !!getCollection(state, { id: collectionId })?.is_album
  )

  const handleConfirm = useCallback(() => {
    dispatch(requestRemoveDownloadedCollection({ collectionId }))
  }, [dispatch, collectionId])

  return (
    <ConfirmationDrawer
      drawerName={drawerName}
      messages={{ ...messages, description: messages.description(isAlbum) }}
      onConfirm={handleConfirm}
    />
  )
}
