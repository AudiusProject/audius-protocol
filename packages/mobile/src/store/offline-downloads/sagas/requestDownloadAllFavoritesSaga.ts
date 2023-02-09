import { accountSelectors, getContext } from '@audius/common'
import { takeEvery, select, call, put } from 'typed-redux-saga'

import { getAccountCollections } from 'app/screens/favorites-screen/selectors'
import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'

import type { OfflineItem } from '../slice'
import { addOfflineItems, requestDownloadAllFavorites } from '../slice'

const { getUserId } = accountSelectors

export function* requestDownloadAllFavoritesSaga() {
  yield* takeEvery(requestDownloadAllFavorites.type, downloadAllFavorites)
}

function* downloadAllFavorites() {
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  const offlineItemsToAdd: OfflineItem[] = []

  offlineItemsToAdd.push({
    type: 'collection',
    id: DOWNLOAD_REASON_FAVORITES,
    metadata: { reasons_for_download: [{ is_from_favorites: true }] }
  })

  const apiClient = yield* getContext('apiClient')
  const allFavoritedTracks = yield* call([apiClient, apiClient.getFavorites], {
    currentUserId,
    limit: 10000
  })

  console.log('favs?', allFavoritedTracks)

  if (!allFavoritedTracks) return

  for (const favoritedTrack of allFavoritedTracks) {
    const { save_item_id: trackId, created_at } = favoritedTrack
    const downloadReason = {
      is_from_favorites: true,
      collection_id: DOWNLOAD_REASON_FAVORITES
    }

    offlineItemsToAdd.push({
      type: 'track',
      id: trackId,
      metadata: {
        favorite_created_at: created_at,
        reasons_for_download: [downloadReason]
      }
    })
  }

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

  yield* put(addOfflineItems({ items: offlineItemsToAdd }))
}
