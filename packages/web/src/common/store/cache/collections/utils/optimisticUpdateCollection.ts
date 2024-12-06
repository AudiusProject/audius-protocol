import { Kind, Collection } from '@audius/common/models'
import { cacheActions } from '@audius/common/store'
import { put } from 'typed-redux-saga'

export function* optimisticUpdateCollection(collection: Collection) {
  const optimisticCollection = { ...collection }
  if (optimisticCollection.artwork?.url) {
    const { artwork } = optimisticCollection
    optimisticCollection.artwork = artwork
  }

  yield* put(
    cacheActions.update(Kind.COLLECTIONS, [
      { id: optimisticCollection.playlist_id, metadata: optimisticCollection }
    ])
  )
}
