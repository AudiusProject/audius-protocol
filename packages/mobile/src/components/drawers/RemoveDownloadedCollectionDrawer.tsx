import { useCallback } from 'react'

import type { CommonState } from '@audius/common'
import { useSelector } from 'react-redux'

import { useDrawer } from 'app/hooks/useDrawer'
import { removeCollectionDownload } from 'app/services/offline-downloader'

import { ConfirmationDrawer } from './ConfirmationDrawer'

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
  const { collectionId, tracksForDownload } = data

  const isAlbum = useSelector(
    (state: CommonState) =>
      state.collections.entries[collectionId]?.metadata.is_album
  )

  const handleConfirm = useCallback(() => {
    removeCollectionDownload(collectionId, tracksForDownload)
  }, [collectionId, tracksForDownload])

  return (
    <ConfirmationDrawer
      drawerName={drawerName}
      messages={{ ...messages, description: messages.description(isAlbum) }}
      onConfirm={handleConfirm}
    />
  )
}
