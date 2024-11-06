import { Kind, TrackMetadata, User } from '@audius/common/models'
import {
  accountSelectors,
  cacheActions,
  reformatUser,
  getContext
} from '@audius/common/store'
import { makeUid } from '@audius/common/utils'
import { uniqBy } from 'lodash'
import { put, select } from 'typed-redux-saga'

import { waitForRead } from 'utils/sagaHelpers'
const { getUserId } = accountSelectors

/**
 * Adds users from track metadata to cache.
 * Dedupes and removes self.
 * @param metadataArray
 */
export function* addUsersFromTracks<T extends TrackMetadata & { user?: User }>(
  metadataArray: T[]
) {
  yield* waitForRead()
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const currentUserId = yield* select(getUserId)
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
