import type { Track, UserMetadata, UserTrackMetadata } from '@audius/common'
import {
  FeatureFlags,
  Kind,
  makeUid,
  cacheActions,
  savedPageTracksLineupActions
} from '@audius/common'
import moment from 'moment'
import { useDispatch } from 'react-redux'
import { useAsync } from 'react-use'

import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { loadTracks } from 'app/store/offline-downloads/slice'

import {
  getTrackJson,
  listTracks,
  verifyTrack
} from '../services/offline-downloader/offline-storage'

export const useLoadOfflineTracks = (collection: string) => {
  const { isEnabled: isOfflineModeEnabled } = useFeatureFlag(
    FeatureFlags.OFFLINE_MODE_ENABLED
  )
  const dispatch = useDispatch()

  useAsync(async () => {
    if (!isOfflineModeEnabled) return

    const trackIds = await listTracks()
    const savesLineupTracks: (Track & UserTrackMetadata & { uid: string })[] =
      []
    const cacheTracks: { uid: string; id: number; metadata: Track }[] = []
    const cacheUsers: { uid: string; id: number; metadata: UserMetadata }[] = []

    for (const trackId of trackIds) {
      try {
        const verified = await verifyTrack(trackId)
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
            if (
              track.offline &&
              track.offline.downloaded_from_collection.includes(collection)
            ) {
              savesLineupTracks.push(lineupTrack)
            }
          })
          .catch(() => console.warn('Failed to load track from disk', trackId))
      } catch (e) {
        console.warn('Error verifying track', trackId, e)
      }
    }

    dispatch(cacheActions.add(Kind.TRACKS, cacheTracks, false, true))
    dispatch(cacheActions.add(Kind.USERS, cacheUsers, false, true))
    dispatch(loadTracks(savesLineupTracks))

    // TODO: support for collection lineups
    dispatch(
      savedPageTracksLineupActions.fetchLineupMetadatasSucceeded(
        savesLineupTracks.map((track) => ({
          uid: track.uid,
          kind: Kind.TRACKS,
          id: track.track_id,
          dateSaved: moment()
        })),
        0,
        savesLineupTracks.length,
        false,
        false
      )
    )
  }, [isOfflineModeEnabled, loadTracks])
}
