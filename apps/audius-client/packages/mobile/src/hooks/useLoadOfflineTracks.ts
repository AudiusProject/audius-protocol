import { useCallback } from 'react'

import type {
  CollectionMetadata,
  Track,
  UserMetadata,
  UserTrackMetadata,
  SmartCollectionVariant
} from '@audius/common'
import {
  savedPageTracksLineupActions,
  Kind,
  makeUid,
  cacheActions,
  cacheCollectionsSelectors,
  savedPageSelectors,
  collectionPageLineupActions,
  collectionPageSelectors
} from '@audius/common'
import { orderBy } from 'lodash'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'
import { store } from 'app/store'
import { getOfflineTracks } from 'app/store/offline-downloads/selectors'
import {
  completeCollectionDownload,
  doneLoadingFromDisk,
  loadTracks
} from 'app/store/offline-downloads/slice'

import {
  getCollectionJson,
  getOfflineCollections,
  getTrackJson,
  listTracks,
  purgeDownloadedCollection,
  verifyTrack
} from '../services/offline-downloader/offline-storage'

import { useIsOfflineModeEnabled } from './useIsOfflineModeEnabled'
import { useReachabilityEffect } from './useReachabilityEffect'
const { getCollection } = cacheCollectionsSelectors
const { getSavedTracksLineup } = savedPageSelectors
const { getCollectionTracksLineup } = collectionPageSelectors

// Load offline data into redux on app start
export const useLoadOfflineData = () => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const dispatch = useDispatch()
  const cacheUsers: { uid: string; id: number; metadata: UserMetadata }[] = []

  useAsync(async () => {
    if (!isOfflineModeEnabled) return

    const offlineCollections = await getOfflineCollections()
    const cacheCollections: {
      id: string
      uid: string
      metadata: CollectionMetadata
    }[] = []
    for (const collectionId of offlineCollections) {
      try {
        if (collectionId === DOWNLOAD_REASON_FAVORITES) {
          dispatch(
            completeCollectionDownload({
              collectionId,
              isFavoritesDownload: false // 'favorites' is not a favorited collection
            })
          )
        } else {
          const collection = await getCollectionJson(collectionId)
          dispatch(
            completeCollectionDownload({
              collectionId,
              isFavoritesDownload: !!collection.offline?.isFavoritesDownload
            })
          )
          cacheCollections.push({
            id: collectionId,
            uid: makeUid(Kind.COLLECTIONS, parseInt(collectionId, 10)),
            metadata: collection
          })
          if (collection.user) {
            cacheUsers.push({
              id: collection.user.user_id,
              uid: makeUid(Kind.USERS, collection.user.user_id),
              metadata: collection.user
            })
          }
        }
      } catch (e) {
        console.warn('Failed to load offline collection', collectionId)
        purgeDownloadedCollection(collectionId)
      }
    }
    dispatch(cacheActions.add(Kind.COLLECTIONS, cacheCollections, false, true))

    const trackIds = await listTracks()
    const cacheTracks: { uid: string; id: number; metadata: Track }[] = []
    const lineupTracks: (Track & UserTrackMetadata & { uid: string })[] = []
    await Promise.all(
      trackIds.map(async (trackId) => {
        try {
          const verified = await verifyTrack(trackId, true)
          if (!verified) return
        } catch (e) {
          console.warn('Error verifying track', trackId, e)
        }
        try {
          const track = await getTrackJson(trackId)
          if (!track) return
          const lineupTrack = {
            uid: makeUid(Kind.TRACKS, track.track_id),
            kind: Kind.TRACKS,
            ...track
          }
          cacheTracks.push({
            id: track.track_id,
            uid: lineupTrack.uid,
            metadata: track
          })
          if (track.user) {
            cacheUsers.push({
              id: track.user.user_id,
              uid: makeUid(Kind.USERS, track.user.user_id),
              metadata: track.user
            })
          }
          lineupTracks.push(lineupTrack)
        } catch (e) {
          console.warn('Failed to load track from disk', trackId, e)
        }
      })
    )

    dispatch(cacheActions.add(Kind.TRACKS, cacheTracks, false, true))
    dispatch(cacheActions.add(Kind.USERS, cacheUsers, false, true))
    dispatch(loadTracks(lineupTracks))
    dispatch(doneLoadingFromDisk())
  }, [isOfflineModeEnabled])
}

/**
 * Load a collection lineup, either online or offline
 * @param collectionId either the numeric collection id
 * TODO: Move this into the component layer
 */
export const useOfflineCollectionLineup = (
  collectionId: number | SmartCollectionVariant | null,
  fetchOnlineContent: () => void
) => {
  const dispatch = useDispatch()
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const offlineTracks = useSelector(getOfflineTracks)
  const collection = useSelector((state) => {
    return getCollection(state, { id: collectionId as number })
  })
  const collectionTracks = useSelector(getCollectionTracksLineup)
  const collectionTrackUidMap = collectionTracks.entries.reduce(
    (acc, track) => {
      acc[track.id] = track.uid
      return acc
    },
    {}
  )

  const fetchLocalContent = useCallback(() => {
    if (isOfflineModeEnabled && collectionId && collection) {
      const lineupTracks = Object.values(offlineTracks)
        .filter((track) =>
          track.offline?.reasons_for_download.some(
            (reason) => reason.collection_id === collectionId.toString()
          )
        )
        .map((track) => ({
          id: track.track_id,
          kind: Kind.TRACKS,
          uid:
            collectionTrackUidMap[track.track_id] ??
            makeUid(Kind.TRACKS, track.track_id)
        }))

      const cacheTracks = lineupTracks.map((track) => ({
        id: track.id,
        uid: track.uid,
        metadata: track
      }))

      store.dispatch(cacheActions.add(Kind.TRACKS, cacheTracks, false, true))

      // Reorder lineup tracks according to the collection
      // TODO: This may have issues for playlists with duplicate tracks
      const sortedTracks = collection.playlist_contents.track_ids
        .map(({ track: trackId, time }) => ({
          ...lineupTracks.find((track) => trackId === track.id),
          // Borrowed from common/store/pages/collection/linups/sagas.js
          // An artifact of non-string legacy data
          dateAdded: typeof time === 'string' ? moment(time) : moment.unix(time)
        }))
        .filter((track) => track.id)

      dispatch(
        collectionPageLineupActions.fetchLineupMetadatasSucceeded(
          sortedTracks,
          0,
          sortedTracks.length,
          0,
          0
        )
      )
    }
  }, [
    collectionTrackUidMap,
    collection,
    collectionId,
    dispatch,
    isOfflineModeEnabled,
    offlineTracks
  ])

  useReachabilityEffect(fetchOnlineContent, fetchLocalContent)
}

/**
 * Load the favorites lineup, either online or offline
 * TODO: Move this into the component layer
 */
export const useOfflineFavoritesLineup = (fetchOnlineContent: () => void) => {
  const dispatch = useDispatch()
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const offlineTracks = useSelector(getOfflineTracks)
  const savedTracks = useSelector(getSavedTracksLineup)
  const savedTracksUidMap = savedTracks.entries.reduce((acc, track) => {
    acc[track.id] = track.uid
    return acc
  }, {})

  const fetchLocalContent = useCallback(() => {
    if (isOfflineModeEnabled) {
      const lineupTracks = Object.values(offlineTracks)
        .filter((track) =>
          track.offline?.reasons_for_download.some(
            (reason) => reason.collection_id === DOWNLOAD_REASON_FAVORITES
          )
        )
        .map((track) => ({
          uid:
            savedTracksUidMap[track.track_id] ??
            makeUid(Kind.TRACKS, track.track_id),
          id: track.track_id,
          dateSaved: track.offline?.favorite_created_at,
          kind: Kind.TRACKS
        }))

      const cacheTracks = lineupTracks.map((track) => ({
        id: track.id,
        uid: track.uid,
        metadata: track
      }))

      store.dispatch(cacheActions.add(Kind.TRACKS, cacheTracks, false, true))

      // Reorder lineup tracks according to favorite time
      const sortedTracks = orderBy(lineupTracks, (track) => track.dateSaved, [
        'desc'
      ])
      dispatch(
        savedPageTracksLineupActions.fetchLineupMetadatasSucceeded(
          sortedTracks,
          0,
          sortedTracks.length,
          0,
          0
        )
      )
    }
  }, [dispatch, isOfflineModeEnabled, offlineTracks, savedTracksUidMap])

  useReachabilityEffect(fetchOnlineContent, fetchLocalContent)
}
