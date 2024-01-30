import { Nullable } from '~/utils'

import { ID, User, UserMetadata } from '../../../models'

import { CollectionSortMode, FollowType } from './types'

export const FETCH_PROFILE = 'PROFILE/FETCH_PROFILE'
export const FETCH_PROFILE_SUCCEEDED = 'PROFILE/FETCH_PROFILE_SUCCEEDED'
export const FETCH_PROFILE_FAILED = 'PROFILE/FETCH_PROFILE_FAILED'

export const SET_CURRENT_USER = 'PROFILE/SET_CURRENT_USER'

export const UPDATE_PROFILE = 'PROFILE/UPDATE_PROFILE'
export const UPDATE_PROFILE_SUCCEEDED = 'PROFILE/UPDATE_PROFILE_SUCCEEDED'
export const UPDATE_PROFILE_FAILED = 'PROFILE/UPDATE_PROFILE_FAILED'

export const UPDATE_COLLECTION_SORT_MODE = 'PROFILE/UPDATE_COLLECTION_SORT_MODE'
export const SET_PROFILE_FIELD = 'PROFILE/SET_PROFILE_FIELD'
export const UPDATE_CURRENT_USER_FOLLOWS = 'PROFILE/UPDATE_CURRENT_USER_FOLLOWS'

export const FETCH_FOLLOW_USERS = 'PROFILE/FETCH_FOLLOW_USERS'
export const FETCH_FOLLOW_USERS_SUCCEEDED =
  'PROFILE/FETCH_FOLLOW_USERS_SUCCEEDED'
export const FETCH_FOLLOW_USERS_FAILED = 'PROFILE/FETCH_FOLLOW_USERS_FAILED'

export const DISMISS_PROFILE_METER = 'PROFILE/DISMISS_PROFILE_METER'

export const FETCH_TOP_TAGS = 'PROFILE/FETCH_TOP_TAGS'
export const FETCH_TOP_TAGS_SUCCEEDED = 'PROFILE/FETCH_TOP_TAGS_SUCCEEDED'
export const FETCH_TOP_TAGS_FAILED = 'PROFILE/FETCH_TOP_TAGS_FAILED'
export const SET_NOTIFICATION_SUBSCRIPTION =
  'PROFILE/SET_NOTIFICATION_SUBSCRIPTION'

export const FETCH_COLLECTIONS = 'PROFILE/FETCH_COLLECTIONS'
export const FETCH_COLLECTIONS_SUCCEEDED = 'PROFILE/FETCH_COLLECTIONS_SUCCEEDED'
export const FETCH_COLLECTIONS_FAILED = 'PROFILE/FETCH_COLLECTIONS_FAILED'

// Either handle or userId is required
// TODO: Move this to redux toolkit
export function fetchProfile(
  handle: Nullable<string>,
  userId: Nullable<ID>,
  forceUpdate: boolean,
  shouldSetLoading: boolean,
  deleteExistingEntry: boolean,
  fetchOnly = false
) {
  return {
    type: FETCH_PROFILE,
    handle,
    userId,
    forceUpdate,
    shouldSetLoading,
    deleteExistingEntry,
    fetchOnly
  }
}

export function fetchProfileSucceeded(
  handle: string,
  userId: ID,
  fetchOnly: boolean
) {
  return { type: FETCH_PROFILE_SUCCEEDED, handle, userId, fetchOnly }
}

export function fetchProfileFailed(handle: string) {
  return { type: FETCH_PROFILE_FAILED, handle }
}

export function setCurrentUser(handle: string) {
  return { type: SET_CURRENT_USER, handle }
}

export function updateProfile(metadata: UserMetadata) {
  return { type: UPDATE_PROFILE, metadata }
}

export function updateProfileSucceeded(userId: ID) {
  return { type: UPDATE_PROFILE_SUCCEEDED, userId }
}

export function updateProfileFailed() {
  return { type: UPDATE_PROFILE_FAILED }
}

export function updateCollectionSortMode(
  mode: CollectionSortMode,
  handle: string
) {
  return { type: UPDATE_COLLECTION_SORT_MODE, mode, handle }
}

export function setProfileField(field: string, value: string, handle: string) {
  return { type: SET_PROFILE_FIELD, field, value, handle }
}

export function updateCurrentUserFollows(follow = false, handle: string) {
  return { type: UPDATE_CURRENT_USER_FOLLOWS, follow, handle }
}

export function fetchFollowUsers(
  followerGroup: FollowType,
  limit = 15,
  offset = 0,
  handle: string
) {
  return { type: FETCH_FOLLOW_USERS, followerGroup, offset, limit, handle }
}

export function fetchFollowUsersSucceeded(
  followerGroup: User[],
  userIds: ID[],
  limit: number,
  offset: number,
  handle: string
) {
  return {
    type: FETCH_FOLLOW_USERS_SUCCEEDED,
    followerGroup,
    userIds,
    limit,
    offset,
    handle
  }
}

export function fetchFollowUsersFailed(
  followerGroup: User[],
  limit: number,
  offset: number,
  handle: string
) {
  return {
    type: FETCH_FOLLOW_USERS_FAILED,
    followerGroup,
    limit,
    offset,
    handle
  }
}

export function profileMeterDismissed() {
  return { type: DISMISS_PROFILE_METER }
}

export function setNotificationSubscription(
  userId: ID,
  isSubscribed: boolean,
  update = false,
  handle?: string
) {
  return {
    type: SET_NOTIFICATION_SUBSCRIPTION,
    userId,
    isSubscribed,
    update,
    handle
  }
}

export function fetchCollections(handle: string) {
  return {
    type: FETCH_COLLECTIONS,
    handle
  }
}

export function fetchCollectionsSucceded(handle: string) {
  return {
    type: FETCH_COLLECTIONS_SUCCEEDED,
    handle
  }
}

export function fetchCollectionsFailed(handle: string) {
  return {
    type: FETCH_COLLECTIONS_FAILED,
    handle
  }
}

export function fetchTopTags(handle: string, userId: ID) {
  return {
    type: FETCH_TOP_TAGS,
    handle,
    userId
  }
}

export function fetchTopTagsSucceeded(handle: string, topTags: string[]) {
  return {
    type: FETCH_TOP_TAGS_SUCCEEDED,
    handle,
    topTags
  }
}

export function fetchTopTagsFailed(handle: string) {
  return {
    type: FETCH_TOP_TAGS_FAILED,
    handle
  }
}
