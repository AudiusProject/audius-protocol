import { useCallback } from 'react'

import { useCollection, useCollectionTracks } from '~/api'
import { useAppContext } from '~/context'
import { ID } from '~/models/Identifiers'
import { updatePlaylistArtwork } from '~/utils/updatePlaylistArtwork'

export const useGeneratePlaylistArtwork = (collectionId?: ID | null) => {
  const { data: collection } = useCollection(collectionId)
  const { data: collectionTracks } = useCollectionTracks(collectionId)

  const { imageUtils } = useAppContext()

  return useCallback(async () => {
    if (!collection || !collectionTracks) return null
    const { artwork } = await updatePlaylistArtwork(
      collection,
      collectionTracks,
      { regenerate: true },
      { generateImage: imageUtils.generatePlaylistArtwork }
    )
    if (!artwork) return null
    const { url, file } = artwork
    if (!url) return null
    return { url, file }
  }, [collection, collectionTracks, imageUtils.generatePlaylistArtwork])
}
