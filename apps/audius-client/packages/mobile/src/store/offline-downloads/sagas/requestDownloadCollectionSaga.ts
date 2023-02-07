import {
  accountSelectors,
  cacheCollectionsSelectors,
  collectionsSocialActions,
  FavoriteSource
} from '@audius/common'
import { takeEvery, select, put } from 'typed-redux-saga'

import type { CollectionAction, OfflineItem } from '../slice'
import { addOfflineItems, requestDownloadCollection } from '../slice'

const { saveCollection } = collectionsSocialActions

const { getUserId } = accountSelectors
const { getCollection } = cacheCollectionsSelectors

export function* requestDownloadCollectionSaga() {
  yield* takeEvery(requestDownloadCollection.type, downloadCollection)
}

function* downloadCollection(action: CollectionAction) {
  const { collectionId } = action.payload
  const collection = yield* select(getCollection, { id: collectionId })
  if (!collection) return

  const { playlist_owner_id, has_current_user_saved } = collection
  const currentUserId = yield* select(getUserId)

  const shouldSaveCollection =
    playlist_owner_id !== currentUserId && !has_current_user_saved

  if (shouldSaveCollection) {
    yield* put(saveCollection(collectionId, FavoriteSource.OFFLINE_DOWNLOAD))
  }

  const offlineItemsToAdd: OfflineItem[] = []

  offlineItemsToAdd.push({
    type: 'collection',
    id: collectionId,
    metadata: { reasons_for_download: [{ is_from_favorites: false }] }
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
          { collection_id: collectionId, is_from_favorites: false }
        ]
      }
    })
  }

  yield* put(addOfflineItems({ items: offlineItemsToAdd }))
}
