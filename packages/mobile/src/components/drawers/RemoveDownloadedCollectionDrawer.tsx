import { useCallback } from 'react'

import { useCollection } from '@audius/common/api'
import { capitalize } from 'lodash'
import { useDispatch } from 'react-redux'

import { useDrawer } from 'app/hooks/useDrawer'
import { requestRemoveDownloadedCollection } from 'app/store/offline-downloads/slice'

import { ConfirmationDrawer } from './ConfirmationDrawer'

const messages = {
  header: 'Are You Sure?',
  description: (contentType: 'album' | 'playlist') =>
    `Are you sure you want to remove this ${contentType} from your device?`,
  confirm: (contentType: 'album' | 'playlist') =>
    `Remove Downloaded ${capitalize(contentType)}`
}

const drawerName = 'RemoveDownloadedCollection'

export const RemoveDownloadedCollectionDrawer = () => {
  const { data } = useDrawer(drawerName)
  const { collectionId } = data
  const dispatch = useDispatch()

  const { data: isAlbum } = useCollection(collectionId, {
    select: (collection) => collection.is_album
  })
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
