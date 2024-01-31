import { accountSelectors, getContext } from '@audius/common/store'
import { takeEvery, select, put, call } from 'typed-redux-saga'

import type { CollectionAction, OfflineEntry } from '../slice'
import { addOfflineEntries, requestDownloadFavoritedCollection } from '../slice'

const { getUserId } = accountSelectors

export function* requestDownloadFavoritedCollectionSaga() {
  yield* takeEvery(
    requestDownloadFavoritedCollection.type,
    downloadFavoritedCollection
  )
}

function* downloadFavoritedCollection(action: CollectionAction) {
  const { collectionId } = action.payload

  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  const apiClient = yield* getContext('apiClient')
  const collection = yield* call([apiClient, apiClient.getCollectionMetadata], {
    collectionId,
    currentUserId
  })

  if (!collection) return

  const offlineItemsToAdd: OfflineEntry[] = []

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

  yield* put(addOfflineEntries({ items: offlineItemsToAdd }))
}
