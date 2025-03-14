import { Kind, TrackMetadata, Track } from '@audius/common/models'
import { cacheActions } from '@audius/common/store'
import { makeUid } from '@audius/common/utils'
import { put, call } from 'typed-redux-saga'

import { waitForRead } from 'utils/sagaHelpers'

import { addUsersFromTracks } from './helpers'
import { reformat } from './reformat'

/**
 * Processes tracks, adding users and calling `reformat`, before
 * caching the tracks.
 */
export function* processAndCacheTracks<T extends TrackMetadata>(
  tracks: T[]
): Generator<any, Track[], any> {
  yield* waitForRead()
  // Add users
  yield* call(addUsersFromTracks, tracks)

  // Remove users, add images
  const reformattedTracks = tracks.map((track) => reformat(track))

  // insert tracks into cache
  yield* put(
    cacheActions.add(
      Kind.TRACKS,
      reformattedTracks.map((t) => ({
        id: t.track_id,
        uid: makeUid(Kind.TRACKS, t.track_id),
        metadata: t
      })),
      /* replace */
      false,
      /* persist */ true
    )
  )

  return reformattedTracks
}
