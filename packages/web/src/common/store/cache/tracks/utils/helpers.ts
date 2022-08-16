import { Kind, TrackMetadata, User, makeUid } from '@audius/common'
import { uniqBy } from 'lodash'
import { put, select } from 'typed-redux-saga'

import { getContext } from 'common/store'
import { getAccountUser } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { reformat as reformatUser } from 'common/store/cache/users/utils'
import { waitForAccount } from 'utils/sagaHelpers'

/**
 * Adds users from track metadata to cache.
 * Dedupes and removes self.
 * @param metadataArray
 */
export function* addUsersFromTracks<T extends TrackMetadata & { user?: User }>(
  metadataArray: T[]
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* waitForAccount()
  const accountUser = yield* select(getAccountUser)
  const currentUserId = accountUser?.user_id
  let users = metadataArray
    .filter((m) => m.user)
    .map((m) => {
      const track = m as TrackMetadata & { user: User }
      return {
        id: track.user.user_id,
        uid: makeUid(Kind.USERS, track.user.user_id),
        metadata: reformatUser(track.user, audiusBackendInstance)
      }
    })

  if (!users.length) return

  // Don't add duplicate users or self
  users = uniqBy(users, 'id')
  users = users.filter((user) => !(currentUserId && user.id === currentUserId))

  yield put(
    cacheActions.add(Kind.USERS, users, /* replace */ false, /* persist */ true)
  )
}
