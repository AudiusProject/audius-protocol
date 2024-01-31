import { ID, SquareSizes, WidthSizes } from '~/models'

export const REMOVE_BY_HANDLE = 'CACHE/USERS/REMOVE_BY_HANDLE'

export const FETCH_PROFILE_PICTURE = 'CACHE/USERS/FETCH_PROFILE_PICTURE'
export const FETCH_COVER_PHOTO = 'CACHE/USERS/FETCH_COVER_PHOTO'
export const FETCH_USER_SOCIALS = 'CACHE/USERS/FETCH_USER_SOCIALS'
export const FETCH_USERS = 'CACHE/USERS/FETCH'

export const removeByHandle = (handle: string) => ({
  type: REMOVE_BY_HANDLE,
  handle
})

export function fetchProfilePicture(
  userId: ID,
  size: WidthSizes | SquareSizes
) {
  return { type: FETCH_PROFILE_PICTURE, userId, size }
}

export function fetchCoverPhoto(userId: ID, size: WidthSizes | SquareSizes) {
  return { type: FETCH_COVER_PHOTO, userId, size }
}

export function fetchUserSocials(handle: string) {
  return { type: FETCH_USER_SOCIALS, handle }
}

export function fetchUsers({
  userIds,
  requiredFields,
  forceRetrieveFromSource = false
}: {
  userIds: ID[]
  requiredFields?: any
  forceRetrieveFromSource?: boolean
}) {
  return {
    type: FETCH_USERS,
    payload: { userIds, requiredFields, forceRetrieveFromSource }
  }
}
