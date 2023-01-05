import {
  Kind,
  makeUid,
  getContext,
  cacheActions,
  UserMetadata
} from '@audius/common'
import { put } from 'typed-redux-saga'

import { waitForRead } from 'utils/sagaHelpers'

import { reformat } from './reformat'

export function* processAndCacheUsers(users: UserMetadata[]) {
  yield* waitForRead()
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const reformattedUser = users.map((user) => {
    return reformat(user, audiusBackendInstance)
  })

  // insert users into cache
  yield* put(
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
