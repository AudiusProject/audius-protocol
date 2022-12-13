import type { Track, UserMetadata, UserTrackMetadata } from '@audius/common'
import {
  Kind,
  makeUid,
  cacheActions,
  savedPageTracksLineupActions,
  reachabilitySelectors
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { getOfflineTracks } from 'app/store/offline-downloads/selectors'
import { addCollection, loadTracks } from 'app/store/offline-downloads/slice'

import {
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

  useAsync(async () => {
    if (!isOfflineModeEnabled) return

    const offlineCollections = await getOfflineCollections()
    offlineCollections?.forEach((collection) => {
      dispatch(addCollection(collection))
    })

    const trackIds = await listTracks()
    const cacheTracks: { uid: string; id: number; metadata: Track }[] = []
    const cacheUsers: { uid: string; id: number; metadata: UserMetadata }[] = []
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

export const useOfflineCollectionLineup = (collection: string) => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const isReachable = useSelector(getIsReachable)
  const offlineTracks = useSelector(getOfflineTracks)

  const dispatch = useDispatch()

  useAsync(async () => {
    if (!isOfflineModeEnabled) return

    const lineupTracks = Object.values(offlineTracks).filter((track) =>
      track.offline?.reasons_for_download.some(
        (reason) => reason.collection_id === collection
      )
    )

    if (!isReachable) {
      // TODO: support for collection lineups
      dispatch(
        savedPageTracksLineupActions.fetchLineupMetadatasSucceeded(
          lineupTracks,
          0,
          lineupTracks.length,
          false,
          false
        )
      )
    }
  }, [isOfflineModeEnabled, isReachable, loadTracks])
}
