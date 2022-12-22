import { useEffect, useState } from 'react'

import type {
  CollectionMetadata,
  Track,
  UserMetadata,
  lineupActions,
  UserTrackMetadata
} from '@audius/common'
import {
  Kind,
  makeUid,
  cacheActions,
  cacheCollectionsSelectors,
  reachabilitySelectors
} from '@audius/common'
import { orderBy } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'
import { getOfflineTracks } from 'app/store/offline-downloads/selectors'
import {
  addCollection,
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
const { getCollection } = cacheCollectionsSelectors
const { getIsReachable } = reachabilitySelectors

export const useLoadOfflineTracks = () => {
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
        if (collectionId === DOWNLOAD_REASON_FAVORITES) continue
        const collection = await getCollectionJson(collectionId)
        dispatch(addCollection(collectionId))
        cacheCollections.push({
          id: collectionId,
          uid: makeUid(Kind.COLLECTIONS, collectionId),
          metadata: collection
        })
        if (collection.user) {
          cacheUsers.push({
            id: collection.user.user_id,
            uid: makeUid(Kind.USERS, collection.user.user_id),
            metadata: collection.user
          })
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
          const track: Track & UserTrackMetadata = await getTrackJson(trackId)
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
  })
}

/**
 * A helper hook that can substitute out the contents of a lineup for the
 * equivalent "offline" version
 * @param collectionId either the numeric collection id or DOWNLOAD_REASON_FAVORITES
 * @param fetchOnlineContent a callback that can be used to refetch the online content
 *  if reachability is established. This is normally what you would call inside
 *  `useFocusEffect` on mount of the lineup
 * @param lineupActions the actions instance for the lineup
 */
export const useOfflineCollectionLineup = (
  collectionId: typeof DOWNLOAD_REASON_FAVORITES | number | null,
  fetchOnlineContent: () => void,
  lineupActions: lineupActions.LineupActions
) => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const isReachable = useSelector(getIsReachable)
  const offlineTracks = useSelector(getOfflineTracks)
  const collection = useSelector((state) => {
    if (collectionId !== DOWNLOAD_REASON_FAVORITES) {
      return getCollection(state, { id: collectionId as number })
    }
  })
  const [hasGoneOffline, setHasGoneOffline] = useState(false)

  const dispatch = useDispatch()

  // Record if we have gone offline so that when we come
  // back online we can refetch fresh content
  useEffect(() => {
    if (!isReachable) {
      setHasGoneOffline(true)
    }
  }, [isReachable, setHasGoneOffline])

  // If we go offline, set lineup into a success state with
  // offline data
  useEffect(() => {
    if (isOfflineModeEnabled && collectionId && !isReachable) {
      const lineupTracks = Object.values(offlineTracks).filter((track) =>
        track.offline?.reasons_for_download.some(
          (reason) => reason.collection_id === collectionId.toString()
        )
      )

      if (collectionId === DOWNLOAD_REASON_FAVORITES) {
        // Reorder lineup tracks accorinding to favorite time
        const sortedTracks = orderBy(
          lineupTracks,
          (track) => track.offline?.favorite_created_at,
          ['desc']
        )
        dispatch(
          lineupActions.fetchLineupMetadatasSucceeded(
            sortedTracks,
            0,
            lineupTracks.length,
            false,
            false
          )
        )
      } else {
        // Reorder lineup tracks according to the collection
        // TODO: This may have issues for playlists with duplicate tracks
        const sortedTracks = collection?.playlist_contents.track_ids.map(
          ({ track: trackId }) =>
            lineupTracks.find((track) => trackId === track.track_id)
        )
        dispatch(
          lineupActions.fetchLineupMetadatasSucceeded(
            sortedTracks,
            0,
            lineupTracks.length,
            false,
            false
          )
        )
      }
    }
  }, [
    dispatch,
    offlineTracks,
    isOfflineModeEnabled,
    lineupActions,
    isReachable,
    collectionId,
    setHasGoneOffline,
    collection?.playlist_contents.track_ids
  ])

  // If we go back online, trigger a refetch of the original content
  useEffect(() => {
    if (isReachable && hasGoneOffline) {
      fetchOnlineContent()
      setHasGoneOffline(false)
    }
  }, [dispatch, isReachable, hasGoneOffline, fetchOnlineContent])
}
