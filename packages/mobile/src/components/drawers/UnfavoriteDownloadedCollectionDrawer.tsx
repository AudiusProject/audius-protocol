import { useCallback } from 'react'

import { FavoriteSource } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import { collectionsSocialActions } from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { useDrawer } from 'app/hooks/useDrawer'

import { ConfirmationDrawer } from './ConfirmationDrawer'

const messages = {
  header: 'Are You Sure?',
  description: (isAlbum: boolean) =>
    `Unfavoriting this ${
      isAlbum ? 'album' : 'playlist'
    } will also remove it from your device`,
  confirm: 'Unfavorite and Remove'
}

const drawerName = 'UnfavoriteDownloadedCollection'
const { unsaveCollection } = collectionsSocialActions

export const UnfavoriteDownloadedCollectionDrawer = () => {
  const { data } = useDrawer(drawerName)
  const dispatch = useDispatch()
  const { collectionId } = data

  const isAlbum = useSelector(
    (state: CommonState) =>
      state.collections.entries[collectionId]?.metadata.is_album
  )

  const handleConfirm = useCallback(() => {
    dispatch(unsaveCollection(collectionId, FavoriteSource.COLLECTION_PAGE))
  }, [collectionId, dispatch])

  return (
    <ConfirmationDrawer
      drawerName={drawerName}
      messages={{ ...messages, description: messages.description(isAlbum) }}
      onConfirm={handleConfirm}
    />
  )
}
