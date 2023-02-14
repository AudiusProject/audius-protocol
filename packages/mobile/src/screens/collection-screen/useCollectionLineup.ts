import { useCallback } from 'react'

import type { SmartCollectionVariant } from '@audius/common'
import {
  areSetsEqual,
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
import { getOfflineTrackIds } from 'app/store/offline-downloads/selectors'

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
  const offlineTrackIds = useSelector(
    (state) => new Set(getOfflineTrackIds(state) || []),
    areSetsEqual
  )
  const isReachable = useSelector(getIsReachable)
  const collection = useSelector((state) => {
    return getCollection(state, { id: collectionId as number })
  })
  const collectionTracks = useSelector(getCollectionTracksLineup)
  const collectionTrackUidMap = collectionTracks.entries.reduce(
    (acc, track) => {
      if (acc[track.id] && acc[track.id].includes(track.id)) {
        return acc
      }
      const collectionTrackUid = makeUid(
        Kind.TRACKS,
        track.id,
        `collection:${collectionId}`
      )
      acc[track.id] = acc[track.id]
        ? acc[track.id].concat(collectionTrackUid)
        : [collectionTrackUid]
      return acc
    },
    {}
  ) as Record<number, string[]>

  const lineup = useProxySelector(getTracksLineup, [isReachable])

  const fetchLineupOffline = useCallback(() => {
    if (isOfflineModeEnabled && collectionId && collection) {
      const trackIdEncounters = {} as Record<number, number>
      const sortedTracks = collection.playlist_contents.track_ids
        .filter(({ track: trackId }) => offlineTrackIds.has(trackId.toString()))
        .map((trackData) => {
          trackIdEncounters[trackData.track] = trackIdEncounters[
            trackData.track
          ]
            ? trackIdEncounters[trackData.track] + 1
            : 0
          return {
            id: trackData.track,
            kind: Kind.TRACKS,
            uid:
              collectionTrackUidMap[trackData.track]?.[
                trackIdEncounters[trackData.track]
              ] ??
              makeUid(
                Kind.TRACKS,
                trackData.track,
                `collection:${collectionId}`
              ),

            dateAdded:
              typeof trackData.time === 'string'
                ? moment(trackData.time)
                : moment.unix(trackData.time)
          }
        })
      const lineupTracks = sortedTracks.map((track) => ({
        id: track.id,
        kind: Kind.TRACKS,
        uid: track.uid
      }))

      const cacheTracks = lineupTracks.map((track) => ({
        id: track.id,
        uid: track.uid,
        metadata: track
      }))

      store.dispatch(cacheActions.add(Kind.TRACKS, cacheTracks, false, true))

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
    offlineTrackIds
  ])

  // Fetch the lineup based on reachability
  useReachabilityEffect(fetchLineup, fetchLineupOffline)

  return lineup
}
