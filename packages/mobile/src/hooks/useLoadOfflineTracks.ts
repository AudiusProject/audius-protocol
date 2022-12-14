import type {
  CollectionMetadata,
  Track,
  UserMetadata,
  UserTrackMetadata
} from '@audius/common'
import {
  collectionPageLineupActions,
  savedPageTracksLineupActions,
  Kind,
  makeUid,
  cacheActions,
  reachabilitySelectors
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'
import { getOfflineTracks } from 'app/store/offline-downloads/selectors'
import { addCollection, loadTracks } from 'app/store/offline-downloads/slice'

import {
  getCollectionJson,
  getOfflineCollections,
  getTrackJson,
  listTracks,
  verifyTrack
} from '../services/offline-downloader/offline-storage'

import { useIsOfflineModeEnabled } from './useIsOfflineModeEnabled'
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
      dispatch(addCollection(collectionId))
      if (collectionId === DOWNLOAD_REASON_FAVORITES) continue
      const collection = await getCollectionJson(collectionId)
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
    }
    dispatch(cacheActions.add(Kind.COLLECTIONS, cacheCollections, false, true))

    const trackIds = await listTracks()
    const cacheTracks: { uid: string; id: number; metadata: Track }[] = []
    const lineupTracks: (Track & UserTrackMetadata & { uid: string })[] = []
    for (const trackId of trackIds) {
      try {
        const verified = await verifyTrack(trackId, true)
        if (!verified) continue
        getTrackJson(trackId)
          .then((track: Track & UserTrackMetadata) => {
            const lineupTrack = {
              uid: makeUid(Kind.TRACKS, track.track_id),
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
          })
          .catch(() => console.warn('Failed to load track from disk', trackId))
      } catch (e) {
        console.warn('Error verifying track', trackId, e)
      }
    }

    dispatch(cacheActions.add(Kind.TRACKS, cacheTracks, false, true))
    dispatch(cacheActions.add(Kind.USERS, cacheUsers, false, true))
    dispatch(loadTracks(lineupTracks))
  })
}

export const useOfflineCollectionLineup = (collectionId?: string) => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const isReachable = useSelector(getIsReachable)
  const offlineTracks = useSelector(getOfflineTracks)

  const dispatch = useDispatch()

  useAsync(async () => {
    if (!isOfflineModeEnabled || !collectionId) return

    const lineupTracks = Object.values(offlineTracks).filter((track) =>
      track.offline?.reasons_for_download.some(
        (reason) => reason.collection_id === collectionId
      )
    )

    if (!isReachable) {
      const populateLinupAction =
        collectionId === DOWNLOAD_REASON_FAVORITES
          ? savedPageTracksLineupActions.fetchLineupMetadatasSucceeded(
              lineupTracks,
              0,
              lineupTracks.length,
              false,
              false
            )
          : collectionPageLineupActions.fetchLineupMetadatasSucceeded(
              lineupTracks,
              0,
              lineupTracks.length,
              false,
              false
            )
      dispatch(populateLinupAction)
    }
  }, [isOfflineModeEnabled, isReachable, loadTracks, collectionId])
}
