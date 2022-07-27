import { UserCollectionMetadata, Kind } from '@audius/common'
import { uniqBy } from 'lodash'
import { put, select } from 'redux-saga/effects'

import { getAccountUser } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { reformat as reformatUser } from 'common/store/cache/users/utils'
import { makeUid } from 'common/utils/uid'

/**
 * Adds users from collection metadata to cache.
 * Dedupes users and removes self.
 * @param metadataArray
 */
export function* addUsersFromCollections(
  metadataArray: Array<UserCollectionMetadata>
) {
  const accountUser: ReturnType<typeof getAccountUser> = yield select(
    getAccountUser
  )
  const currentUserId = accountUser?.user_id
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
