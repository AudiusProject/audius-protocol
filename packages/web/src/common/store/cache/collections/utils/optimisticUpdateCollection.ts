import { Kind, Collection } from '@audius/common/models'
import { cacheActions } from '@audius/common/store'
import { put } from 'typed-redux-saga'

export function* optimisticUpdateCollection(collection: Collection) {
  const optimisticCollection = { ...collection }
  if (optimisticCollection.artwork?.url) {
    const { artwork } = optimisticCollection
    const { url } = artwork
    optimisticCollection.artwork = artwork
    const coverArtSizes = optimisticCollection._cover_art_sizes ?? {}
    coverArtSizes.OVERRIDE = url
    optimisticCollection._cover_art_sizes = coverArtSizes
  }

  yield* put(
    cacheActions.update(Kind.COLLECTIONS, [
      { id: optimisticCollection.playlist_id, metadata: optimisticCollection }
    ])
  )
}
