import { useCallback } from 'react'

import type { Collection } from '@audius/common'
import { cacheCollectionsSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { useDrawer } from 'app/hooks/useDrawer'
import { removeCollectionDownload } from 'app/services/offline-downloader'

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

  const collection = useSelector((state) =>
    getCollection(state, { id: collectionId })
  ) as Collection

  const { is_album, tracks } = collection

  const tracksForDownload = tracks?.map(({ track_id }) => ({
    trackId: track_id,
    downloadReason: {
      is_from_favorites: false,
      collection_id: collectionId.toString()
    }
  }))

  const handleConfirm = useCallback(() => {
    removeCollectionDownload(collectionId.toString(), tracksForDownload ?? [])
  }, [collectionId, tracksForDownload])

  return (
    <ConfirmationDrawer
      drawerName={drawerName}
      messages={{ ...messages, description: messages.description(is_album) }}
      onConfirm={handleConfirm}
    />
  )
}
