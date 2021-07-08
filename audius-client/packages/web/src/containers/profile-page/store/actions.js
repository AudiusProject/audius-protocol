export const FETCH_PROFILE = 'PROFILE/FETCH_PROFILE'
export const FETCH_PROFILE_SUCCEEDED = 'PROFILE/FETCH_PROFILE_SUCCEEDED'
export const FETCH_PROFILE_FAILED = 'PROFILE/FETCH_PROFILE_FAILED'

export const UPDATE_PROFILE = 'PROFILE/UPDATE_PROFILE'
export const UPDATE_PROFILE_SUCCEEDED = 'PROFILE/UPDATE_PROFILE_SUCCEEDED'
export const UPDATE_PROFILE_FAILED = 'PROFILE/UPDATE_PROFILE_FAILED'

export const RESET_PROFILE = 'PROFILE/RESET_PROFILE'

export const UPDATE_COLLECTION_SORT_MODE = 'PROFILE/UPDATE_COLLECTION_SORT_MODE'
export const SET_PROFILE_FIELD = 'PROFILE/SET_PROFILE_FIELD'
export const UPDATE_CURRENT_USER_FOLLOWS = 'PROFILE/UPDATE_CURRENT_USER_FOLLOWS'

export const FETCH_FOLLOW_USERS = 'PROFILE/FETCH_FOLLOW_USERS'
export const FETCH_FOLLOW_USERS_SUCCEEDED =
  'PROFILE/FETCH_FOLLOW_USERS_SUCCEEDED'
export const FETCH_FOLLOW_USERS_FAILED = 'PROFILE/FETCH_FOLLOW_USERS_FAILED'

export const DISMISS_PROFILE_METER = 'PROFILE/DISMISS_PROFILE_METER'

export const UPDATE_MOST_USED_TAGS = 'PROFILE/UPDATE_MOST_USED_TAGS'
export const SET_NOTIFICATION_SUBSCRIPTION =
  'PROFILE/SET_NOTIFICATION_SUBSCRIPTION'

// Either handle or userId is required
// TODO: Move this to redux toolkit
export function fetchProfile(
  handle,
  userId,
  forceUpdate,
  shouldSetLoading,
  deleteExistingEntry
) {
  return {
    type: FETCH_PROFILE,
    handle,
    userId,
    forceUpdate,
    shouldSetLoading,
    deleteExistingEntry
  }
}

export function fetchProfileSucceeded(handle, userId) {
  return { type: FETCH_PROFILE_SUCCEEDED, handle, userId }
}

export function fetchProfileFailed() {
  return { type: FETCH_PROFILE_FAILED }
}

export function updateProfile(metadata) {
  return { type: UPDATE_PROFILE, metadata }
}

export function updateProfileSucceeded(userId) {
  return { type: UPDATE_PROFILE_SUCCEEDED, userId }
}

export function updateProfileFailed() {
  return { type: UPDATE_PROFILE_FAILED }
}

export function resetProfile() {
  return { type: RESET_PROFILE }
}

export function updateCollectionSortMode(mode) {
  return { type: UPDATE_COLLECTION_SORT_MODE, mode }
}

export function setProfileField(field, value) {
  return { type: SET_PROFILE_FIELD, field, value }
}

export function updateCurrentUserFollows(follow = false) {
  return { type: UPDATE_CURRENT_USER_FOLLOWS, follow }
}

export function fetchFollowUsers(followerGroup, limit = 15, offset = 0) {
  return { type: FETCH_FOLLOW_USERS, followerGroup, offset, limit }
}

export function fetchFollowUsersSucceeded(
  followerGroup,
  userIds,
  limit,
  offset
) {
  return {
    type: FETCH_FOLLOW_USERS_SUCCEEDED,
    followerGroup,
    userIds,
    limit,
    offset
  }
}

export function fetchFollowUsersFailed(followerGroup, limit, offset) {
  return { type: FETCH_FOLLOW_USERS_FAILED, followerGroup, limit, offset }
}

export function profileMeterDismissed() {
  return { type: DISMISS_PROFILE_METER }
}

export function updateMostUsedTags(mustUsedTags) {
  return { type: UPDATE_MOST_USED_TAGS, mustUsedTags }
}

export function setNotificationSubscription(
  userId,
  isSubscribed,
  update = false
) {
  return { type: SET_NOTIFICATION_SUBSCRIPTION, userId, isSubscribed, update }
}
