import { call } from 'typed-redux-saga'

import { primeUserDataSaga } from '~/api/tan-query/utils/primeUserData'
import { UserMetadata } from '~/models/User'
import { waitForRead } from '~/utils/sagaHelpers'

export function* processAndCacheUsers(users: UserMetadata[]) {
  yield* waitForRead()
  const reformattedUsers = users.map((user) => {
    return reformatUser(user)
  })

  // insert users into cache
  yield* call(primeUserDataSaga, reformattedUsers)

  return reformattedUsers
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
