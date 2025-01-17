import { ID, UserMetadata } from '../../../models'

import { CollectionSortMode } from './types'

export const FETCH_PROFILE_SUCCEEDED = 'PROFILE/FETCH_PROFILE_SUCCEEDED'

export const SET_CURRENT_USER = 'PROFILE/SET_CURRENT_USER'

export const UPDATE_PROFILE = 'PROFILE/UPDATE_PROFILE'
export const UPDATE_PROFILE_SUCCEEDED = 'PROFILE/UPDATE_PROFILE_SUCCEEDED'
export const UPDATE_PROFILE_FAILED = 'PROFILE/UPDATE_PROFILE_FAILED'

export const UPDATE_COLLECTION_SORT_MODE = 'PROFILE/UPDATE_COLLECTION_SORT_MODE'
export const SET_PROFILE_FIELD = 'PROFILE/SET_PROFILE_FIELD'

export const DISMISS_PROFILE_METER = 'PROFILE/DISMISS_PROFILE_METER'

export const SET_NOTIFICATION_SUBSCRIPTION =
  'PROFILE/SET_NOTIFICATION_SUBSCRIPTION'

export type FetchProfileSucceededAction = {
  type: typeof FETCH_PROFILE_SUCCEEDED
  userId: ID
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

export type SetNotificationSubscriptionAction = {
  type: typeof SET_NOTIFICATION_SUBSCRIPTION
  userId: ID
  isSubscribed: boolean
  update?: boolean
  handle?: string
}

export type ProfilePageAction =
  | FetchProfileSucceededAction
  | SetCurrentUserAction
  | UpdateProfileAction
  | UpdateProfileSucceededAction
  | UpdateProfileFailedAction
  | UpdateCollectionSortModeAction
  | SetProfileFieldAction
  | DismissProfileMeterAction
  | SetNotificationSubscriptionAction

export function fetchProfileSucceeded(userId: ID): FetchProfileSucceededAction {
  return { type: FETCH_PROFILE_SUCCEEDED, userId }
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
