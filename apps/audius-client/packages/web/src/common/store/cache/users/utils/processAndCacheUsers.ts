import { User, Kind, makeUid } from '@audius/common'
import { put } from 'redux-saga/effects'

import * as cacheActions from 'common/store/cache/actions'

import { reformat } from './reformat'

export function* processAndCacheUsers(users: User[]) {
  const reformattedUser = users.map((user) => {
    return reformat(user)
  })

  // insert users into cache
  yield put(
    cacheActions.add(
      Kind.USERS,
      reformattedUser.map((u) => ({
        id: u.user_id,
        uid: makeUid(Kind.USERS, u.user_id),
        metadata: u
      })),
      false,
      true
    )
  )

  return reformattedUser
}
