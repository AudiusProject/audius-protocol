import { useCallback } from 'react'

import type { CommonState } from '@audius/common'
import { FavoriteSource, collectionsSocialActions } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { useDrawer } from 'app/hooks/useDrawer'
import { removeCollectionDownload } from 'app/services/offline-downloader'

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
  const collectionIdStr = collectionId.toString()
  const isAlbum = useSelector(
    (state: CommonState) =>
      state.collections.entries[collectionId]?.metadata.is_album
  )

  const tracksForDownload = useSelector((state: CommonState) => {
    const collection = state.collections.entries[collectionId]
    if (!collection) return []
    const { tracks } = collection.metadata
    if (!tracks) return []

    return tracks.flatMap(({ track_id }) => [
      {
        trackId: track_id,
        downloadReason: {
          is_from_favorites: false,
          collection_id: collectionIdStr
        }
      },
      {
        trackId: track_id,
        downloadReason: {
          is_from_favorites: false,
          collection_id: collectionIdStr
        }
      }
    ])
  })

  const handleConfirm = useCallback(() => {
    dispatch(unsaveCollection(collectionId, FavoriteSource.COLLECTION_PAGE))
    removeCollectionDownload(collectionIdStr, tracksForDownload)
  }, [collectionId, collectionIdStr, tracksForDownload, dispatch])

  return (
    <ConfirmationDrawer
      drawerName={drawerName}
      messages={{ ...messages, description: messages.description(isAlbum) }}
      onConfirm={handleConfirm}
    />
  )
}
