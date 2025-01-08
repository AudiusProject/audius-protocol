import { Nullable } from '~/utils'

import { ID, UserMetadata } from '../../../models'

import { CollectionSortMode } from './types'

export const FETCH_PROFILE = 'PROFILE/FETCH_PROFILE'
export const FETCH_PROFILE_SUCCEEDED = 'PROFILE/FETCH_PROFILE_SUCCEEDED'
export const FETCH_PROFILE_FAILED = 'PROFILE/FETCH_PROFILE_FAILED'

export const SET_CURRENT_USER = 'PROFILE/SET_CURRENT_USER'

export const UPDATE_PROFILE = 'PROFILE/UPDATE_PROFILE'
export const UPDATE_PROFILE_SUCCEEDED = 'PROFILE/UPDATE_PROFILE_SUCCEEDED'
export const UPDATE_PROFILE_FAILED = 'PROFILE/UPDATE_PROFILE_FAILED'

export const UPDATE_COLLECTION_SORT_MODE = 'PROFILE/UPDATE_COLLECTION_SORT_MODE'
export const SET_PROFILE_FIELD = 'PROFILE/SET_PROFILE_FIELD'

export const DISMISS_PROFILE_METER = 'PROFILE/DISMISS_PROFILE_METER'

export const FETCH_TOP_TAGS = 'PROFILE/FETCH_TOP_TAGS'
export const FETCH_TOP_TAGS_SUCCEEDED = 'PROFILE/FETCH_TOP_TAGS_SUCCEEDED'
export const FETCH_TOP_TAGS_FAILED = 'PROFILE/FETCH_TOP_TAGS_FAILED'

export const SET_NOTIFICATION_SUBSCRIPTION =
  'PROFILE/SET_NOTIFICATION_SUBSCRIPTION'

export type FetchProfileAction = {
  type: typeof FETCH_PROFILE
  handle: string | null
  userId: ID | null
  forceUpdate: boolean
  shouldSetLoading: boolean
  deleteExistingEntry: boolean
  fetchOnly?: boolean
}

export type FetchProfileSucceededAction = {
  type: typeof FETCH_PROFILE_SUCCEEDED
  handle: string
  userId: ID
  fetchOnly: boolean
}

export type FetchProfileFailedAction = {
  type: typeof FETCH_PROFILE_FAILED
  handle: string
}

export type SetCurrentUserAction = {
  type: typeof SET_CURRENT_USER
  handle: string
}

export type UpdateProfileAction = {
  type: typeof UPDATE_PROFILE
  metadata: UserMetadata
}

export type UpdateProfileSucceededAction = {
  type: typeof UPDATE_PROFILE_SUCCEEDED
  userId: ID
}

export type UpdateProfileFailedAction = {
  type: typeof UPDATE_PROFILE_FAILED
}

export type UpdateCollectionSortModeAction = {
  type: typeof UPDATE_COLLECTION_SORT_MODE
  mode: CollectionSortMode
  handle: string
}

export type SetProfileFieldAction = {
  type: typeof SET_PROFILE_FIELD
  field: string
  value: string
  handle: string
}

export type DismissProfileMeterAction = {
  type: typeof DISMISS_PROFILE_METER
}

export type FetchTopTagsAction = {
  type: typeof FETCH_TOP_TAGS
  handle: string
  userId: ID
}

export type FetchTopTagsSucceededAction = {
  type: typeof FETCH_TOP_TAGS_SUCCEEDED
  handle: string
  topTags: string[]
}

export type FetchTopTagsFailedAction = {
  type: typeof FETCH_TOP_TAGS_FAILED
  handle: string
}

export type SetNotificationSubscriptionAction = {
  type: typeof SET_NOTIFICATION_SUBSCRIPTION
  userId: ID
  isSubscribed: boolean
  update?: boolean
  handle?: string
}

export type ProfilePageAction =
  | FetchProfileAction
  | FetchProfileSucceededAction
  | FetchProfileFailedAction
  | SetCurrentUserAction
  | UpdateProfileAction
  | UpdateProfileSucceededAction
  | UpdateProfileFailedAction
  | UpdateCollectionSortModeAction
  | SetProfileFieldAction
  | DismissProfileMeterAction
  | FetchTopTagsAction
  | FetchTopTagsSucceededAction
  | FetchTopTagsFailedAction
  | SetNotificationSubscriptionAction

// Either handle or userId is required
// TODO: Move this to redux toolkit
export function fetchProfile(
  handle: Nullable<string>,
  userId: Nullable<ID>,
  forceUpdate: boolean,
  shouldSetLoading: boolean,
  deleteExistingEntry: boolean,
  fetchOnly = false
): FetchProfileAction {
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
): FetchProfileSucceededAction {
  return { type: FETCH_PROFILE_SUCCEEDED, handle, userId, fetchOnly }
}

export function fetchProfileFailed(handle: string): FetchProfileFailedAction {
  return { type: FETCH_PROFILE_FAILED, handle }
}

export function setCurrentUser(handle: string): SetCurrentUserAction {
  return { type: SET_CURRENT_USER, handle }
}

export function updateProfile(metadata: UserMetadata): UpdateProfileAction {
  return { type: UPDATE_PROFILE, metadata }
}

export function updateProfileSucceeded(
  userId: ID
): UpdateProfileSucceededAction {
  return { type: UPDATE_PROFILE_SUCCEEDED, userId }
}

export function updateProfileFailed(): UpdateProfileFailedAction {
  return { type: UPDATE_PROFILE_FAILED }
}

export function updateCollectionSortMode(
  mode: CollectionSortMode,
  handle: string
): UpdateCollectionSortModeAction {
  return { type: UPDATE_COLLECTION_SORT_MODE, mode, handle }
}

export function setProfileField(
  field: string,
  value: string,
  handle: string
): SetProfileFieldAction {
  return { type: SET_PROFILE_FIELD, field, value, handle }
}

export function profileMeterDismissed(): DismissProfileMeterAction {
  return { type: DISMISS_PROFILE_METER }
}

export function setNotificationSubscription(
  userId: ID,
  isSubscribed: boolean,
  update = false,
  handle?: string
): SetNotificationSubscriptionAction {
  return {
    type: SET_NOTIFICATION_SUBSCRIPTION,
    userId,
    isSubscribed,
    update,
    handle
  }
}

export function fetchTopTags(handle: string, userId: ID): FetchTopTagsAction {
  return {
    type: FETCH_TOP_TAGS,
    handle,
    userId
  }
}

export function fetchTopTagsSucceeded(
  handle: string,
  topTags: string[]
): FetchTopTagsSucceededAction {
  return {
    type: FETCH_TOP_TAGS_SUCCEEDED,
    handle,
    topTags
  }
}

export function fetchTopTagsFailed(handle: string): FetchTopTagsFailedAction {
  return {
    type: FETCH_TOP_TAGS_FAILED,
    handle
  }
}
