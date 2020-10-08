import { TrackMetadata } from 'models/Track'
import User from 'models/User'
import { Kind } from 'store/types'
import { put } from 'redux-saga/effects'
import * as cacheActions from 'store/cache/actions'
import { reformat as reformatUser } from 'store/cache/users/utils'
import { makeUid } from 'utils/uid'

/**
 * Adds users from track metadata to cache.
 * @param metadataArray
 */
export function* addUsersFromTracks<T extends TrackMetadata & { user?: User }>(
  metadataArray: T[]
) {
  const users = metadataArray
    .filter(m => m.user)
    .map(m => {
      const track = m as TrackMetadata & { user: User }
      return {
        id: track.user.user_id,
        uid: makeUid(Kind.USERS, track.user.user_id),
        metadata: reformatUser(track.user)
      }
    })

  if (!users.length) return
  yield put(
    cacheActions.add(Kind.USERS, users, /* replace */ false, /* persist */ true)
  )
}
