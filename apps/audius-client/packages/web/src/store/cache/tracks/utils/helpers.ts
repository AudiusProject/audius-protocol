import { TrackMetadata } from 'models/Track'
import User from 'models/User'
import { Kind } from 'store/types'
import { put, select } from 'redux-saga/effects'
import * as cacheActions from 'store/cache/actions'
import { reformat as reformatUser } from 'store/cache/users/utils'
import { makeUid } from 'utils/uid'
import { getAccountUser } from 'store/account/selectors'
import { uniqBy } from 'lodash'

/**
 * Adds users from track metadata to cache.
 * Dedupes and removes self.
 * @param metadataArray
 */
export function* addUsersFromTracks<T extends TrackMetadata & { user?: User }>(
  metadataArray: T[]
) {
  const accountUser: ReturnType<typeof getAccountUser> = yield select(
    getAccountUser
  )
  const currentUserId = accountUser?.user_id
  let users = metadataArray
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

  // Don't add duplicate users or self
  users = uniqBy(users, 'id')
  users = users.filter(user => !(currentUserId && user.id === currentUserId))

  yield put(
    cacheActions.add(Kind.USERS, users, /* replace */ false, /* persist */ true)
  )
}
