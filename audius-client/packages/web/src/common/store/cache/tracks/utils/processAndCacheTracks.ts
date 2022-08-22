import {
  Kind,
  Track,
  TrackMetadata,
  makeUid,
  cacheActions,
  getContext
} from '@audius/common'
import { put, call } from 'redux-saga/effects'

import { setTracksIsBlocked } from './blocklist'
import { addUsersFromTracks } from './helpers'
import { reformat } from './reformat'

/**
 * Processes tracks, adding users and calling `reformat`, before
 * caching the tracks.
 * @param tracks
 */
export function* processAndCacheTracks<T extends TrackMetadata>(
  tracks: T[]
): Generator<any, Track[], any> {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  // Add users
  yield addUsersFromTracks(tracks)

  const checkedTracks: T[] = yield call(
    setTracksIsBlocked,
    tracks,
    audiusBackendInstance
  )

  // Remove users, add images
  const reformattedTracks = checkedTracks.map((track) =>
    reformat(track, audiusBackendInstance)
  )

  // insert tracks into cache
  yield put(
    cacheActions.add(
      Kind.TRACKS,
      reformattedTracks.map((t) => ({
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
