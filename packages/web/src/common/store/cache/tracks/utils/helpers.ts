import { uniqBy } from 'lodash'
import { put, select } from 'redux-saga/effects'

import Kind from 'common/models/Kind'
import { TrackMetadata } from 'common/models/Track'
import { User } from 'common/models/User'
import { getAccountUser } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { reformat as reformatUser } from 'common/store/cache/users/utils'
import { makeUid } from 'common/utils/uid'

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
