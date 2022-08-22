// @ts-nocheck
// TODO(nkang) - convert to TS
export const SET_HANDLE_STATUS = 'CACHE/USERS/SET_HANDLE_STATUS'
export const REMOVE_BY_HANDLE = 'CACHE/USERS/REMOVE_BY_HANDLE'

export const FETCH_PROFILE_PICTURE = 'CACHE/USERS/FETCH_PROFILE_PICTURE'
export const FETCH_COVER_PHOTO = 'CACHE/USERS/FETCH_COVER_PHOTO'
export const FETCH_USER_SOCIALS = 'CACHE/USERS/FETCH_USER_SOCIALS'

/**
 * @param {array} statuses {handle, status, id} id is optional
 */
export const setHandleStatus = (statuses) => ({
  type: SET_HANDLE_STATUS,
  statuses
})

/**
 * @param {string} handle
 */
export const removeByHandle = (handle) => ({
  type: REMOVE_BY_HANDLE,
  handle
})

export function fetchProfilePicture(userId, size) {
  return { type: FETCH_PROFILE_PICTURE, userId, size }
}

export function fetchCoverPhoto(userId, size) {
  return { type: FETCH_COVER_PHOTO, userId, size }
}

export function fetchUserSocials(handle) {
  return { type: FETCH_USER_SOCIALS, handle }
}
