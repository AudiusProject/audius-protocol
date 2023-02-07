import { cacheCollectionsSelectors } from '@audius/common'
import { takeEvery, select, put } from 'typed-redux-saga'

import type { CollectionAction, OfflineItem } from '../slice'
import { addOfflineItems, requestDownloadFavoritedCollection } from '../slice'

const { getCollection } = cacheCollectionsSelectors

export function* requestDownloadFavoritedCollectionSaga() {
  takeEvery(
    requestDownloadFavoritedCollection.type,
    downloadFavoritedCollection
  )
}

function* downloadFavoritedCollection(action: CollectionAction) {
  const { collectionId } = action.payload
  const collection = yield* select(getCollection, { id: collectionId })
  if (!collection) return

  const offlineItemsToAdd: OfflineItem[] = []

  offlineItemsToAdd.push({
    type: 'collection',
    id: collectionId,
    metadata: { reasons_for_download: [{ is_from_favorites: true }] }
  })

  const {
    playlist_contents: { track_ids }
  } = collection

  for (const { track: trackId } of track_ids) {
    offlineItemsToAdd.push({
      type: 'track',
      id: trackId,
      metadata: {
        reasons_for_download: [
          { collection_id: collectionId, is_from_favorites: true }
        ]
      }
    })
  }

  yield* put(addOfflineItems({ items: offlineItemsToAdd }))
}
