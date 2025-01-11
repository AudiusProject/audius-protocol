import { transformAndCleanList, favoriteFromSDK } from '@audius/common/adapters'
import { Id } from '@audius/common/models'
import { accountSelectors, getSDK } from '@audius/common/store'
import { fetchAllAccountCollections } from 'common/store/saved-collections/sagas'
import { takeEvery, select, call, put } from 'typed-redux-saga'

import { getAccountCollections } from 'app/screens/favorites-screen/selectors'
import { make, track } from 'app/services/analytics'
import { DOWNLOAD_REASON_FAVORITES } from 'app/store/offline-downloads/constants'
import { EventNames } from 'app/types/analytics'

import type { OfflineEntry } from '../slice'
import { addOfflineEntries, requestDownloadAllFavorites } from '../slice'

const { getUserId } = accountSelectors

export function* requestDownloadAllFavoritesSaga() {
  yield* takeEvery(requestDownloadAllFavorites.type, downloadAllFavorites)
}

function* downloadAllFavorites() {
  track(make({ eventName: EventNames.OFFLINE_MODE_DOWNLOAD_ALL_TOGGLE_ON }))
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  const offlineItemsToAdd: OfflineEntry[] = []

  offlineItemsToAdd.push({
    type: 'collection',
    id: DOWNLOAD_REASON_FAVORITES,
    metadata: { reasons_for_download: [{ is_from_favorites: true }] }
  })

  const trackReasonsForDownload = [
    { is_from_favorites: true, collection_id: DOWNLOAD_REASON_FAVORITES }
  ]

  // Note: Local saves support was removed, to be added back later

  // Add favorited tracks from api
  const sdk = yield* getSDK()

  const { data } = yield* call([sdk.users, sdk.users.getFavorites], {
    id: Id.parse(currentUserId)
  })
  const allFavoritedTracks = transformAndCleanList(data, favoriteFromSDK)

  if (allFavoritedTracks) {
    for (const favoritedTrack of allFavoritedTracks) {
      const { save_item_id: trackId, created_at } = favoritedTrack

      offlineItemsToAdd.push({
        type: 'track',
        id: trackId,
        metadata: {
          favorite_created_at: created_at,
          reasons_for_download: trackReasonsForDownload
        }
      })
    }
  }

  // Add favorited collections and their tracks
  // AccountCollections don't include track lists, so retrieve all the collections
  // first
  yield* call(fetchAllAccountCollections)
  const favoritedCollections = yield* select(getAccountCollections)

  for (const favoritedCollection of favoritedCollections) {
    const { playlist_id } = favoritedCollection
    const downloadReason = { is_from_favorites: true }

    offlineItemsToAdd.push({
      type: 'collection',
      id: playlist_id,
      metadata: {
        reasons_for_download: [downloadReason]
      }
    })
  }

  for (const favoritedCollection of favoritedCollections) {
    const {
      playlist_id,
      playlist_contents: { track_ids }
    } = favoritedCollection

    for (const { track: trackId } of track_ids) {
      const downloadReason = {
        is_from_favorites: true,
        collection_id: playlist_id
      }

      offlineItemsToAdd.push({
        type: 'track',
        id: trackId,
        metadata: { reasons_for_download: [downloadReason] }
      })
    }
  }

  yield* put(addOfflineEntries({ items: offlineItemsToAdd }))
}
