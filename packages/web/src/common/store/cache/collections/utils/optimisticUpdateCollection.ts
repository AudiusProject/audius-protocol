import { updateCollectionData } from '@audius/common/api'
import { Collection } from '@audius/common/models'
import { call } from 'typed-redux-saga'

export function* optimisticUpdateCollection(collection: Collection) {
  const optimisticCollection = { ...collection }
  if (optimisticCollection.artwork?.url) {
    const { artwork } = optimisticCollection
    optimisticCollection.artwork = artwork
  }

  yield* call(updateCollectionData, [optimisticCollection])
}
