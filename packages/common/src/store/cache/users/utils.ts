import { put } from 'typed-redux-saga'

import { Kind } from '~/models/Kind'
import { UserMetadata } from '~/models/User'
import * as cacheActions from '~/store/cache/actions'
import { waitForRead } from '~/utils/sagaHelpers'
import { makeUid } from '~/utils/uid'

export function* processAndCacheUsers(users: UserMetadata[]) {
  yield* waitForRead()
  const reformattedUser = users.map((user) => {
    return reformatUser(user)
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

/**
 * Sets a user's display name to their handle if it is falsey.
 * During sign-up, it's possible for an account to be created but the set display
 * name transaction to fail, which would leave us in a bad UI state.
 */
const setDisplayNameToHandleIfUnset = <T extends UserMetadata>(user: T) => {
  if (user.name) return user
  return {
    ...user,
    name: user.handle
  }
}

/**
 * Reformats a user to be used internally within the client.
 * This method should *always* be called before a user is cached.
 */
export const reformatUser = (user: UserMetadata) => {
  const withNames = setDisplayNameToHandleIfUnset(user)

  return withNames
}
