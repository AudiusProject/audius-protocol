import { useCallback } from 'react'

import type { SmartCollectionVariant } from '@audius/common'
import {
  useProxySelector,
  Kind,
  makeUid,
  cacheActions,
  cacheCollectionsSelectors,
  collectionPageLineupActions,
  collectionPageSelectors,
  lineupSelectors,
  reachabilitySelectors
} from '@audius/common'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'

import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useReachabilityEffect } from 'app/hooks/useReachabilityEffect'
import { store } from 'app/store'
import { getOfflineTracks } from 'app/store/offline-downloads/selectors'

const { getCollection } = cacheCollectionsSelectors
const { getCollectionTracksLineup } = collectionPageSelectors
const { makeGetTableMetadatas } = lineupSelectors
const { getIsReachable } = reachabilitySelectors

const getTracksLineup = makeGetTableMetadatas(getCollectionTracksLineup)

/**
 * Returns a collection lineup, supports boths online and offline
 * @param collectionId the numeric collection id
 */
export const useCollectionLineup = (
  collectionId: number | SmartCollectionVariant | null,
  fetchLineup: () => void
) => {
  const dispatch = useDispatch()
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const offlineTracks = useSelector(getOfflineTracks)
  const isReachable = useSelector(getIsReachable)
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

  const lineup = useProxySelector(getTracksLineup, [isReachable])

  const fetchLineupOffline = useCallback(() => {
    if (isOfflineModeEnabled && collectionId && collection) {
      const collectionTrackIds = new Set(
        collection?.playlist_contents?.track_ids?.map(
          (trackData) => trackData.track
        ) || []
      )
      const lineupTracks = offlineTracks
        .filter(
          (track) =>
            track.offline?.reasons_for_download.some(
              (reason) => reason.collection_id === collectionId.toString()
            ) || collectionTrackIds.has(track.track_id)
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

  // Fetch the lineup based on reachability
  useReachabilityEffect(fetchLineup, fetchLineupOffline)

  return lineup
}
