import { makeUid } from 'utils/uid'
import { UserCollection } from 'models/Collection'
import { Kind } from 'store/types'
import { reformat as reformatUser } from 'store/cache/users/utils'
import { put } from 'redux-saga/effects'
import * as cacheActions from 'store/cache/actions'

export function* addUsersFromCollections(metadataArray: Array<UserCollection>) {
  const users = metadataArray.map(m => ({
    id: m.user.user_id,
    uid: makeUid(Kind.USERS, m.user.user_id),
    metadata: reformatUser(m.user)
  }))

  yield put(
    cacheActions.add(Kind.USERS, users, /* replace */ false, /* persist */ true)
  )
}
