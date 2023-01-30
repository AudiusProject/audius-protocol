import type {
  Collection,
  CommonState,
  DownloadReason,
  UserCollectionMetadata
} from '@audius/common'
import { accountSelectors, cacheTracksSelectors } from '@audius/common'
import moment from 'moment'
import queue from 'react-native-job-queue'

import type { TrackForDownload } from 'app/components/offline-downloads'
import { fetchAllFavoritedTracks } from 'app/hooks/useFetchAllFavoritedTracks'
import { store } from 'app/store'
import { isAvailableForPlay } from 'app/utils/trackUtils'

import { apiClient } from '../audius-api-client'

import {
  batchDownloadTrack,
  batchRemoveTrackDownload,
  downloadCollection,
  downloadCollectionCoverArt,
  downloadTrackCoverArt,
  DOWNLOAD_REASON_FAVORITES,
  removeDownloadedCollectionFromFavorites
} from './offline-downloader'
import { purgeDownloadedTrack, writeTrackJson } from './offline-storage'
import type { TrackDownloadWorkerPayload } from './workers/trackDownloadWorker'
import { TRACK_DOWNLOAD_WORKER } from './workers/trackDownloadWorker'

const { getTracks } = cacheTracksSelectors
const { getUserId } = accountSelectors

const STALE_DURATION_TRACKS = moment.duration(7, 'days')

export const syncFavoritedTracks = async () => {
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

export const syncFavoritedCollections = async (
  offlineCollections: Collection[],
  userCollections: Collection[]
) => {
  const oldCollectionIds = new Set(
    offlineCollections.map((collection) => collection.playlist_id)
  )
  const newCollectionIds = new Set(
    userCollections.map((collection) => collection.playlist_id)
  )
  const addedCollections = [...userCollections].filter(
    (collection) => !oldCollectionIds.has(collection.playlist_id)
  )
  const removedCollections = [...offlineCollections].filter(
    (collection) => !newCollectionIds.has(collection.playlist_id)
  )

  addedCollections.forEach((collection) => {
    downloadCollection(collection, /* isFavoritesDownload */ true)
  })

  removedCollections.forEach((collection) => {
    const tracksForDownload =
      collection.tracks?.map((track) => ({
        trackId: track.track_id,
        downloadReason: {
          is_from_favorites: true,
          collection_id: collection.playlist_id?.toString()
        }
      })) ?? []

    removeDownloadedCollectionFromFavorites(
      collection.playlist_id.toString(),
      tracksForDownload
    )
  })
}

export const syncCollectionsTracks = async (
  collections: Collection[],
  isFavoritesDownload?: boolean
) => {
  collections.forEach((collection) => {
    syncCollectionTracks(collection, isFavoritesDownload)
  })
}

export const syncCollectionTracks = async (
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

  downloadCollection(
    updatedCollection,
    isFavoritesDownload,
    /* skipTracks */ true
  )
  if (updatedCollection.cover_art_sizes !== offlineCollection.cover_art_sizes) {
    downloadCollectionCoverArt(updatedCollection)
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
  batchRemoveTrackDownload(tracksForDelete)

  // TODO: known bug here we should track multiple download reasons for the collection
  // and apply each download reason to the sync'd tracks.
  // Impact would be wrongly removing tracks when favorites toggle is turned off.
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

export const syncStaleTracks = () => {
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
      if (updatedTrack.cover_art_sizes !== staleTrack.cover_art_sizes) {
        downloadTrackCoverArt(updatedTrack)
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
