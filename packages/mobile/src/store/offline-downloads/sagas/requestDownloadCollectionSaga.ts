import {
  accountSelectors,
  collectionsSocialActions,
  getContext
} from '@audius/common'
import { FavoriteSource } from '@audius/common/models'
import { takeEvery, select, put, call } from 'typed-redux-saga'

import { make, track } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

import type { CollectionAction, OfflineEntry } from '../slice'
import { addOfflineEntries, requestDownloadCollection } from '../slice'

const { saveCollection } = collectionsSocialActions

const { getUserId } = accountSelectors

export function* requestDownloadCollectionSaga() {
  yield* takeEvery(requestDownloadCollection.type, downloadCollection)
}

function* downloadCollection(action: CollectionAction) {
  const { collectionId } = action.payload
  track(
    make({
      eventName: EventNames.OFFLINE_MODE_DOWNLOAD_COLLECTION_TOGGLE_ON,
      collectionId
    })
  )

  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  const apiClient = yield* getContext('apiClient')
  const collection = yield* call([apiClient, apiClient.getCollectionMetadata], {
    collectionId,
    currentUserId
  })

  if (!collection) return

  const { playlist_owner_id, has_current_user_saved } = collection

  const shouldSaveCollection =
    playlist_owner_id !== currentUserId && !has_current_user_saved

  if (shouldSaveCollection) {
    yield* put(saveCollection(collectionId, FavoriteSource.OFFLINE_DOWNLOAD))
  }

  const offlineItemsToAdd: OfflineEntry[] = []

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

  yield* put(addOfflineEntries({ items: offlineItemsToAdd }))
}
