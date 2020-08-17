import AudiusBackend from 'services/AudiusBackend'
import User from 'models/User'

/**
 * Adds profile picture and cover art to a user object if it does not have one set
 * */
const addUserImages = (user: User) => {
  return AudiusBackend.getUserImages(user)
}

/**
 * Sets a user's display name to their handle if it is falsey.
 * During sign-up, it's possible for an account to be created but the set display
 * name transaction to fail, which would leave us in a bad UI state.
 */
const setDisplayNameToHandleIfUnset = (user: User) => {
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
export const reformat = (user: User) => {
  let u = user
  u = addUserImages(u)
  u = setDisplayNameToHandleIfUnset(u)
  return u
}
