import { queryCurrentUserId } from '@audius/common/api'
import { Kind, UserCollectionMetadata } from '@audius/common/models'
import { cacheActions, reformatUser } from '@audius/common/store'
import { makeUid } from '@audius/common/utils'
import { uniqBy } from 'lodash'
import { put, call } from 'typed-redux-saga'

import { waitForRead } from 'utils/sagaHelpers'

/**
 * Adds users from collection metadata to cache.
 * Dedupes users and removes self.
 * @param metadataArray
 */
export function* addUsersFromCollections(
  metadataArray: Array<UserCollectionMetadata>
) {
  yield* waitForRead()
  const currentUserId = yield* call(queryCurrentUserId)
  let users = metadataArray.map((m) => ({
    id: m.user.user_id,
    uid: makeUid(Kind.USERS, m.user.user_id),
    metadata: reformatUser(m.user)
  }))

  // Removes duplicates and self
  users = uniqBy(users, 'id')
  users = users.filter((user) => !(currentUserId && user.id === currentUserId))

  yield put(
    cacheActions.add(Kind.USERS, users, /* replace */ false, /* persist */ true)
  )
}
