import { UserTrack } from 'models/Track'
import { put } from 'redux-saga/effects'
import * as cacheActions from 'store/cache/actions'
import { reformat } from './reformat'
import { Kind } from 'store/types'
import { makeUid } from 'utils/uid'
import { addUsersFromTracks } from './helpers'

/**
 * Processes tracks, adding users and calling `reformat`, before
 * caching the tracks.
 * @param tracks
 */
export function* processAndCacheTracks(tracks: UserTrack[]) {
  // Add users
  yield addUsersFromTracks(tracks)

  // Remove users, add images
  const reformattedTracks = tracks.map(t => reformat(t))

  // insert tracks into cache
  yield put(
    cacheActions.add(
      Kind.TRACKS,
      reformattedTracks.map(t => ({
        id: t.track_id,
        uid: makeUid(Kind.TRACKS, t.track_id),
        metadata: t
      })),
      false,
      true
    )
  )

  return reformattedTracks
}
