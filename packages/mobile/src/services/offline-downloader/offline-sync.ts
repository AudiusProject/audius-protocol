import type {
  Collection,
  CommonState,
  DownloadReason,
  UserCollectionMetadata
} from '@audius/common'
import {
  cacheCollectionsSelectors,
  accountSelectors,
  cacheTracksSelectors
} from '@audius/common'
import moment from 'moment'
import queue from 'react-native-job-queue'

import type { TrackForDownload } from 'app/components/offline-downloads'
import { fetchAllFavoritedTracks } from 'app/hooks/useFetchAllFavoritedTracks'
import { store } from 'app/store'
import { getOfflineCollections } from 'app/store/offline-downloads/selectors'
import { populateCoverArtSizes } from 'app/utils/populateCoverArtSizes'
import { pingTest } from 'app/utils/reachability'
import { isAvailableForPlay } from 'app/utils/trackUtils'

import { apiClient } from '../audius-api-client'

import {
  batchDownloadTrack,
  batchRemoveTrackDownload,
  downloadCollection,
  downloadCollectionCoverArt,
  downloadTrackCoverArt,
  DOWNLOAD_REASON_FAVORITES,
  removeCollectionDownload
} from './offline-downloader'
import { purgeDownloadedTrack, writeTrackJson } from './offline-storage'
import type { TrackDownloadWorkerPayload } from './workers/trackDownloadWorker'
import { TRACK_DOWNLOAD_WORKER } from './workers/trackDownloadWorker'

const { getCollections } = cacheCollectionsSelectors
const { getTracks } = cacheTracksSelectors
const { getUserId } = accountSelectors

const STALE_DURATION_TRACKS = moment.duration(7, 'days')

/**
 * Favorites
 *  Check for new and removed track favorites
 *  Check for new and removed collections
 */
export const startSyncWorker = async () => {
  const reachable = await pingTest()
  if (!reachable) return

  const state = store.getState()
  const collections = getCollections(state)
  const offlineCollectionsState = getOfflineCollections(state)
  if (offlineCollectionsState[DOWNLOAD_REASON_FAVORITES]) {
    // TODO: should we await all the sync calls? Potential race conditions
    syncFavorites()
  }
  const offlineCollections = Object.entries(offlineCollectionsState)
    .filter(
      ([id, isDownloaded]) => isDownloaded && id !== DOWNLOAD_REASON_FAVORITES
    )
    .map(([id, isDownloaded]) => collections[id] ?? null)
    .filter((collection) => !!collection)

  offlineCollections.forEach((collection) => {
    syncCollection(collection)
  })

  // TODO: diff favorited collections with discovery, queue/remove them for download

  syncStaleTracks()
}

const syncFavorites = async () => {
  const state = store.getState()

  const currentUserId = getUserId(state as unknown as CommonState)
  if (!currentUserId) return

  const favoritedTracks = await fetchAllFavoritedTracks(currentUserId)
  const cacheTracks = getTracks(state, {})

  const isTrackFavoriteReason = (downloadReason: DownloadReason) =>
    downloadReason.is_from_favorites &&
    downloadReason.collection_id === DOWNLOAD_REASON_FAVORITES

  const queuedTracks = (await queue.getJobs())
    .filter(({ workerName }) => workerName === TRACK_DOWNLOAD_WORKER)
    .map(({ payload }) => JSON.parse(payload) as TrackDownloadWorkerPayload)
    .filter(({ downloadReason }) => isTrackFavoriteReason(downloadReason))
    .map(({ trackId }) => trackId)
  const cachedFavoritedTrackIds = Object.entries(cacheTracks)
    .filter(([id, track]) =>
      track.offline?.reasons_for_download.some(isTrackFavoriteReason)
    )
    .map(([id, track]) => track.track_id)

  const oldTrackIds = new Set([...queuedTracks, ...cachedFavoritedTrackIds])
  const newTrackIds = new Set(favoritedTracks.map(({ trackId }) => trackId))
  const addedTracks = [...favoritedTracks].filter(
    ({ trackId }) => !oldTrackIds.has(trackId)
  )
  const removedTrackIds = [...oldTrackIds].filter(
    (trackId) => !newTrackIds.has(trackId)
  )

  const tracksForDownload: TrackForDownload[] = addedTracks.map(
    (addedTrack) => ({
      trackId: addedTrack.trackId,
      downloadReason: {
        is_from_favorites: true,
        collection_id: DOWNLOAD_REASON_FAVORITES
      },
      favoriteCreatedAt: addedTrack.favoriteCreatedAt
    })
  )
  batchDownloadTrack(tracksForDownload)

  const tracksForDelete: TrackForDownload[] = removedTrackIds.map(
    (removedTrack) => ({
      trackId: removedTrack,
      downloadReason: {
        is_from_favorites: true,
        collection_id: DOWNLOAD_REASON_FAVORITES
      }
    })
  )
  batchRemoveTrackDownload(tracksForDelete)
}

const syncCollection = async (
  offlineCollection: Collection,
  isFavoritesDownload?: boolean
) => {
  // TODO: record and check last verified time for collections
  const state = store.getState()
  const currentUserId = getUserId(state as unknown as CommonState)
  const collectionId = offlineCollection.playlist_id
  const collectionIdStr = offlineCollection.playlist_id.toString()
  const updatedCollection: UserCollectionMetadata | undefined = (
    await apiClient.getPlaylist({
      playlistId: collectionId,
      currentUserId
    })
  )?.[0]

  // TODO: will discovery serve a removed playlist?
  if (!updatedCollection) return

  if (
    moment(updatedCollection.updated_at).isSameOrBefore(
      offlineCollection.updated_at
    )
  ) {
    return
  }

  const updatedCollectionWithArt = await populateCoverArtSizes(
    updatedCollection
  )

  downloadCollection(updatedCollectionWithArt)
  if (
    updatedCollectionWithArt.cover_art_sizes !==
    offlineCollection.cover_art_sizes
  ) {
    downloadCollectionCoverArt(updatedCollectionWithArt)
  }

  const oldTrackIds = new Set(
    offlineCollection.tracks?.map((track) => track.track_id)
  )
  const newTrackIds = new Set(
    updatedCollection.tracks?.map((track) => track.track_id)
  )
  const addedTrackIds = [...newTrackIds].filter(
    (trackId) => !oldTrackIds.has(trackId)
  )
  const removedTrackIds = [...oldTrackIds].filter(
    (trackId) => !newTrackIds.has(trackId)
  )

  const tracksForDelete: TrackForDownload[] = removedTrackIds.map(
    (removedTrack) => ({
      trackId: removedTrack,
      downloadReason: {
        is_from_favorites: isFavoritesDownload,
        collection_id: collectionIdStr
      }
    })
  )
  removeCollectionDownload(collectionIdStr, tracksForDelete)

  const tracksForDownload: TrackForDownload[] = addedTrackIds.map(
    (addedTrack) => ({
      trackId: addedTrack,
      downloadReason: {
        is_from_favorites: isFavoritesDownload,
        collection_id: collectionIdStr
      }
    })
  )
  batchDownloadTrack(tracksForDownload)
}

const syncStaleTracks = () => {
  const state = store.getState()
  const cacheTracks = getTracks(state, {})
  const currentUserId = getUserId(state as unknown as CommonState)
  if (!currentUserId) return

  const staleCachedTracks = Object.entries(cacheTracks)
    .filter(
      ([id, track]) =>
        track.offline &&
        moment()
          .subtract(STALE_DURATION_TRACKS)
          .isAfter(moment(track.offline?.last_verified_time))
    )
    .map(([id, track]) => track)

  staleCachedTracks.forEach(async (staleTrack) => {
    const updatedTrack = await apiClient.getTrack({
      id: staleTrack.track_id,
      currentUserId
    })

    if (!updatedTrack) return

    // If track should not be available
    if (!isAvailableForPlay(updatedTrack, currentUserId)) {
      purgeDownloadedTrack(staleTrack.track_id.toString())
      return
    }

    if (moment(updatedTrack.updated_at).isAfter(staleTrack.updated_at)) {
      const updatedTrackWithArt = await populateCoverArtSizes(updatedTrack)

      if (updatedTrackWithArt.cover_art_sizes !== staleTrack.cover_art_sizes) {
        downloadTrackCoverArt(updatedTrackWithArt)
      }
    }

    // TODO: re-download the mp3 if it's changed
    const trackToWrite = {
      ...updatedTrack,
      offline: {
        download_completed_time:
          staleTrack.offline?.download_completed_time ?? Date.now(),
        reasons_for_download: staleTrack.offline?.reasons_for_download ?? [],
        last_verified_time: Date.now(),
        favorite_created_at: staleTrack.offline?.favorite_created_at
      }
    }
    writeTrackJson(updatedTrack.track_id.toString(), trackToWrite)
  })
}
