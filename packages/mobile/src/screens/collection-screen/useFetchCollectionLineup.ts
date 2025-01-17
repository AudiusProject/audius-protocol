import { useCallback } from 'react'

import type { SmartCollectionVariant } from '@audius/common/models'
import { Kind } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  cacheActions,
  collectionPageLineupActions,
  collectionPageSelectors,
  queueSelectors
} from '@audius/common/store'
import { areSetsEqual, Uid, makeUid } from '@audius/common/utils'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'

import { useReachabilityEffect } from 'app/hooks/useReachabilityEffect'
import { getOfflineTrackIds } from 'app/store/offline-downloads/selectors'

const { getCollection } = cacheCollectionsSelectors
const { getCollectionTracksLineup } = collectionPageSelectors
const { getPositions } = queueSelectors

// tan-query TODO: make this work with react-query fetches
/**
 * Returns a collection lineup, supports boths online and offline
 * @param collectionId the numeric collection id
 */
export const useFetchCollectionLineup = (
  collectionId: number | SmartCollectionVariant | null,
  fetchLineup: () => void
) => {
  const dispatch = useDispatch()
  const offlineTrackIds = useSelector(
    (state) => new Set(getOfflineTrackIds(state) || []),
    areSetsEqual
  )
  const collection = useSelector((state) => {
    return getCollection(state, { id: collectionId as number })
  })

  const collectionUidSource = `collection:${collectionId}`
  const queuePositions = useSelector(getPositions)
  const queueTrackUids = Object.keys(queuePositions).map(Uid.fromString)
  // Get every UID in the queue whose source references this lineup
  // in the form of { id: [uid1, uid2] }
  const queueUidsByTrackId: Record<number, string[]> = queueTrackUids
    .filter((uid) => uid.source === collectionUidSource)
    .reduce((mapping, uid) => {
      if (uid.id in mapping) {
        mapping[uid.id].push(uid.toString())
      } else {
        mapping[uid.id] = [uid.toString()]
      }
      return mapping
    }, {})

  const collectionTracks = useSelector(getCollectionTracksLineup)
  const collectionTrackUidMap = collectionTracks.entries.reduce(
    (acc, track) => {
      if (acc[track.id] && acc[track.id].includes(track.id)) {
        return acc
      }
      const collectionTrackUid =
        track.uid ?? makeUid(Kind.TRACKS, track.id, collectionUidSource)
      acc[track.id] = acc[track.id]
        ? acc[track.id].concat(collectionTrackUid)
        : [collectionTrackUid]
      return acc
    },
    {}
  ) as Record<number, string[]>

  const fetchLineupOffline = useCallback(() => {
    if (collectionId && collection) {
      const trackIdEncounters = {} as Record<number, number>
      const sortedTracks = collection.playlist_contents.track_ids
        .filter(({ track: trackId }) => offlineTrackIds.has(trackId.toString()))
        .map(({ track: trackId, time }) => {
          trackIdEncounters[trackId] = trackIdEncounters[trackId]
            ? trackIdEncounters[trackId] + 1
            : 0
          return {
            id: trackId,
            kind: Kind.TRACKS,
            uid:
              queueUidsByTrackId[trackId]?.[trackIdEncounters[trackId]] ??
              collectionTrackUidMap[trackId]?.[trackIdEncounters[trackId]] ??
              makeUid(Kind.TRACKS, trackId, collectionUidSource),

            dateAdded:
              typeof time === 'string' ? moment(time) : moment.unix(time)
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

      dispatch(cacheActions.add(Kind.TRACKS, cacheTracks, false, true))

      dispatch(
        collectionPageLineupActions.fetchLineupMetadatasSucceeded(
          sortedTracks,
          0,
          sortedTracks.length,
          0,
          0,
          undefined,
          false /* hasMore override */
        )
      )
    }
  }, [
    collectionId,
    collection,
    dispatch,
    offlineTrackIds,
    queueUidsByTrackId,
    collectionTrackUidMap,
    collectionUidSource
  ])

  // Fetch the lineup based on reachability
  useReachabilityEffect(fetchLineup, fetchLineupOffline)
}
