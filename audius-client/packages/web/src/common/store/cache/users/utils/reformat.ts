import {
  CoverPhotoSizes,
  ProfilePictureSizes,
  User,
  UserMetadata
} from '@audius/common'

import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

/**
 * Adds profile picture and cover art to a user object if it does not have one set
 * */
const addUserImages = (
  user: UserMetadata
): UserMetadata & {
  _profile_picture_sizes: ProfilePictureSizes
  _cover_photo_sizes: CoverPhotoSizes
} => {
  return audiusBackendInstance.getUserImages(user)
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
export const reformat = (user: UserMetadata): User => {
  const withImages = addUserImages(user)
  const withNames = setDisplayNameToHandleIfUnset(withImages)
  return withNames
}
