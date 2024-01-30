import { cacheActions, makeUid } from '@audius/common'
import type {
  CollectionMetadata,
  ID,
  UID,
  TrackMetadata,
  UserMetadata
} from '@audius/common/models'
import { Kind } from '@audius/common/models'
import { call, select, put } from 'typed-redux-saga'

import {
  getCollectionJson,
  getTrackJson
} from 'app/services/offline-downloader'

import { DOWNLOAD_REASON_FAVORITES } from '../constants'
import {
  getOfflineCollectionsStatus,
  getOfflineTrackStatus
} from '../selectors'
import type { OfflineJob } from '../slice'
import {
  redownloadOfflineItems,
  doneLoadingFromDisk,
  OfflineDownloadStatus
} from '../slice'

import { getIsOfflineEnabled } from './getIsOfflineEnabled'
import { migrateOfflineDataPathSaga } from './migrateOfflineDataPathSaga'

type CachedCollection = { id: ID; uid: UID; metadata: CollectionMetadata }
type CachedUser = { id: ID; uid: UID; metadata: UserMetadata }
type CachedTrack = { id: ID; uid: UID; metadata: TrackMetadata }

// Load offline data into redux on app start
export function* rehydrateOfflineDataSaga() {
  const isOfflineModeEnabled = yield* call(getIsOfflineEnabled)
  if (!isOfflineModeEnabled) return

  // Can remove this after all clients are likely updated
  yield* migrateOfflineDataPathSaga()

  const collectionsToCache: CachedCollection[] = []
  const usersToCache: CachedUser[] = []
  const tracksToCache: CachedTrack[] = []
  const collectionsToRedownload: OfflineJob[] = []
  const tracksToRedownload: OfflineJob[] = []

  const offlineCollectionStatus = yield* select(getOfflineCollectionsStatus)
  const downloadedCollectionIds = Object.keys(offlineCollectionStatus).filter(
    (collectionId) =>
      offlineCollectionStatus[collectionId] === OfflineDownloadStatus.SUCCESS
  )

  for (const collectionId of downloadedCollectionIds) {
    if (collectionId === DOWNLOAD_REASON_FAVORITES) continue
    const userCollection = yield* call(getCollectionJson, collectionId)
    if (userCollection === null) {
      collectionsToRedownload.push({
        type: 'collection',
        id: Number(collectionId)
      })
      continue
    }

    const { user, ...collection } = userCollection
    const id = parseInt(collectionId, 10)

    collectionsToCache.push({
      id,
      uid: makeUid(Kind.COLLECTIONS, id),
      metadata: { ...collection, local: true }
    })

    if (user) {
      const { user_id } = user
      usersToCache.push({
        id: user_id,
        uid: makeUid(Kind.USERS, user_id),
        metadata: { ...user, local: true }
      })
    }
  }

  const offlineTrackStatus = yield* select(getOfflineTrackStatus)
  const downloadedTrackIds = Object.keys(offlineTrackStatus).filter(
    (id) => offlineTrackStatus[id] === OfflineDownloadStatus.SUCCESS
  )

  for (const trackId of downloadedTrackIds) {
    const userTrack = yield* call(getTrackJson, trackId)
    if (userTrack === null) {
      tracksToRedownload.push({
        type: 'track',
        id: Number(trackId)
      })
      continue
    }

    const { user, ...track } = userTrack
    const { track_id } = track

    tracksToCache.push({
      id: track_id,
      uid: makeUid(Kind.TRACKS, track_id),
      metadata: { ...track, local: true }
    })

    if (user) {
      const { user_id } = user
      usersToCache.push({
        id: user_id,
        uid: makeUid(Kind.USERS, user_id),
        metadata: { ...user, local: true }
      })
    }
  }

  if (collectionsToRedownload.length > 0 || tracksToRedownload.length > 0) {
    yield* put(
      redownloadOfflineItems({
        items: [...collectionsToRedownload, ...tracksToRedownload]
      })
    )
  }

  if (collectionsToCache.length > 0) {
    yield* put(
      cacheActions.add(Kind.COLLECTIONS, collectionsToCache, false, true)
    )
  }

  if (tracksToCache.length > 0) {
    yield* put(cacheActions.add(Kind.TRACKS, tracksToCache, false, true))
  }

  if (usersToCache.length > 0) {
    yield* put(cacheActions.add(Kind.USERS, usersToCache, false, true))
  }

  yield* put(doneLoadingFromDisk())
}
