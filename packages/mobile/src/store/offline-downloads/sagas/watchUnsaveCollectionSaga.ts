import { collectionsSocialActions } from '@audius/common/store'
import { put, select, takeEvery } from 'typed-redux-saga'

import {
  getIsCollectionMarkedForDownload,
  getOfflineTrackMetadata
} from '../selectors'
import type { OfflineEntry } from '../slice'
import { removeOfflineItems } from '../slice'

const { UNSAVE_COLLECTION, unsaveCollection } = collectionsSocialActions

export function* watchUnsaveCollectionSaga() {
  yield* takeEvery(UNSAVE_COLLECTION, removeFavoritedDownloadedCollection)
}

function* removeFavoritedDownloadedCollection(
  action: ReturnType<typeof unsaveCollection>
) {
  const { collectionId } = action
  const isCollectionMarkedForDownload = yield* select(
    getIsCollectionMarkedForDownload(collectionId)
  )

  if (!isCollectionMarkedForDownload) return

  const offlineItemsToRemove: OfflineEntry[] = []

  offlineItemsToRemove.push({
    type: 'collection',
    id: collectionId,
    metadata: {
      reasons_for_download: [
        { is_from_favorites: false },
        { is_from_favorites: true }
      ]
    }
  })

  const offlineTrackMetadata = yield* select(getOfflineTrackMetadata)
  const offlineTrackIds = Object.keys(offlineTrackMetadata).map((id) =>
    parseInt(id, 10)
  )

  for (const offlineTrackId of offlineTrackIds) {
    offlineItemsToRemove.push({
      type: 'track',
      id: offlineTrackId,
      metadata: {
        reasons_for_download: [
          { collection_id: collectionId, is_from_favorites: false },
          { collection_id: collectionId, is_from_favorites: true }
        ]
      }
    })
  }

  yield* put(removeOfflineItems({ items: offlineItemsToRemove }))
}
