import { UserMetadata, AudiusBackend } from '@audius/common'

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
export const reformat = (
  user: UserMetadata,
  audiusBackendInstance: AudiusBackend
) => {
  const withImages = audiusBackendInstance.getUserImages(user)

  const withNames = setDisplayNameToHandleIfUnset(withImages)
  return withNames
}
