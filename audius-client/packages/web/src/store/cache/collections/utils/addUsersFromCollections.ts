import { uniqBy } from 'lodash'
import { put, select } from 'redux-saga/effects'

import { UserCollectionMetadata } from 'models/Collection'
import { getAccountUser } from 'store/account/selectors'
import * as cacheActions from 'store/cache/actions'
import { reformat as reformatUser } from 'store/cache/users/utils'
import { Kind } from 'store/types'
import { makeUid } from 'utils/uid'

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
  let users = metadataArray.map(m => ({
    id: m.user.user_id,
    uid: makeUid(Kind.USERS, m.user.user_id),
    metadata: reformatUser(m.user)
  }))

  // Removes duplicates and self
  users = uniqBy(users, 'id')
  users = users.filter(user => !(currentUserId && user.id === currentUserId))

  yield put(
    cacheActions.add(Kind.USERS, users, /* replace */ false, /* persist */ true)
  )
}
