import { getUser } from '~/store/cache/users/selectors'
import type { CommonState } from '~/store/commonStore'
import { createDeepEqualSelector } from '~/utils/selectorHelpers'

import { Status } from '../../../models'
import type { ID } from '../../../models'

import { initialState as initialFeedState } from './lineups/feed/reducer'
import { PREFIX as TRACKS_PREFIX } from './lineups/tracks/actions'
import { initialState as initialTracksState } from './lineups/tracks/reducer'

const getProfile = (state: CommonState, handle?: string) => {
  const profileHandle = handle?.toLowerCase() ?? state.pages.profile.currentUser
  if (!profileHandle) return null
  return state.pages.profile.entries[profileHandle]
}

// Profile selectors
export const getProfileStatus = (state: CommonState, handle?: string) =>
  getProfile(state, handle)?.status ?? Status.IDLE
export const getProfileEditStatus = (state: CommonState, handle?: string) => {
  const profile = getProfile(state, handle)
  if (!profile) return Status.IDLE
  const { updating, updateError, updateSuccess } = profile
  if (!updating && !updateError && !updateSuccess) return Status.IDLE
  if (updating) return Status.LOADING
  if (!updating && updateSuccess) return Status.SUCCESS
  if (!updating && updateError) return Status.ERROR
  return Status.IDLE
}
export const getProfileError = (state: CommonState, handle?: string) =>
  getProfile(state, handle)?.error
export const getProfileUserId = (state: CommonState, handle?: string) =>
  getProfile(state, handle)?.userId
export const getProfileUserHandle = (state: CommonState) =>
  state.pages.profile.currentUser
export const getProfileCollectionSortMode = (
  state: CommonState,
  handle: string
) => getProfile(state, handle)?.collectionSortMode
export const getIsSubscribed = (state: CommonState, handle?: string) =>
  getProfile(state, handle)?.isNotificationSubscribed
export const getProfileUser = (
  state: CommonState,
  params?: { handle?: string | null; id?: ID }
) => {
  const profileHandle = getProfileUserHandle(state)
  if (!params) return getUser(state, { handle: profileHandle })

  const { id, handle } = params
  if (id) return getUser(state, params)
  return getUser(state, { handle: handle ?? profileHandle })
}

export const getProfileFeedLineup = (state: CommonState, handle?: string) =>
  getProfile(state, handle)?.feed ?? initialFeedState
export const getProfileTracksLineup = (state: CommonState, handle?: string) =>
  getProfile(state, handle)?.tracks ?? initialTracksState

export const getTopTagsStatus = (state: CommonState, handle: string) =>
  getProfile(state, handle)?.topTagsStatus

export const getTopTags = (state: CommonState, handle: string) =>
  getProfile(state, handle)?.topTags

export const makeGetProfile = () => {
  return createDeepEqualSelector(
    [getProfileStatus, getProfileError, getProfileUserId, getIsSubscribed],
    (status, error, userId, isSubscribed) => {
      const emptyState = {
        isSubscribed: false,
        status
      }
      if (error) return { ...emptyState, error: true }
      if (!userId) return emptyState

      return {
        status,
        isSubscribed
      }
    }
  )
}

export const getTrackSource = (state: CommonState, handle: string) =>
  `${TRACKS_PREFIX}:${getProfileUserId(state, handle)}`
