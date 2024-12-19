import { uniq } from 'lodash'

import { getCollections } from '~/store/cache/collections/selectors'
import { getUser, getUsers } from '~/store/cache/users/selectors'
import type { CommonState } from '~/store/commonStore'
import dayjs from '~/utils/dayjs'
import { createDeepEqualSelector } from '~/utils/selectorHelpers'
import { removeNullable } from '~/utils/typeUtils'

import { Status } from '../../../models'
import type { Collection, ID, User, UserCollection } from '../../../models'

import { initialState as initialFeedState } from './lineups/feed/reducer'
import { PREFIX as TRACKS_PREFIX } from './lineups/tracks/actions'
import { initialState as initialTracksState } from './lineups/tracks/reducer'
import { CollectionSortMode } from './types'

const getProfile = (state: CommonState, handle?: string) => {
  const profileHandle = handle?.toLowerCase() ?? state.pages.profile.currentUser
  if (!profileHandle) return null
  return state.pages.profile.entries[profileHandle]
}

const emptyList: any[] = []

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
export const getCollectionsStatus = (state: CommonState, handle?: string) =>
  getProfile(state, handle)?.collectionStatus as Status
export const getProfileFollowers = (state: CommonState, handle?: string) =>
  getProfile(state, handle)?.followers
export const getProfileFollowees = (state: CommonState, handle?: string) =>
  getProfile(state, handle)?.followees
export const getFolloweeFollows = (state: CommonState, handle?: string) =>
  getProfile(state, handle)?.followeeFollows
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

export const getProfileCollections = createDeepEqualSelector(
  [
    (state: CommonState, handle: string) => getProfileUserId(state, handle),
    getUsers,
    getCollections
  ],
  (userId, users, collections) => {
    if (!userId) return undefined
    const user: User = users[userId]
    if (!user) return undefined
    const { handle, _collectionIds } = user
    const userCollections = _collectionIds
      ?.map((collectionId) => collections[collectionId as unknown as number])
      .filter((collection) => {
        if (collection) {
          const { is_delete, _marked_deleted, _moved } = collection
          return !(is_delete || _marked_deleted || _moved)
        }
        return false
      })
      .map(
        (collection) => ({ ...collection, user: { handle } }) as UserCollection
      )
    return userCollections
  }
)

export const getProfileAlbums = createDeepEqualSelector(
  [getProfileCollections],
  (collections) => uniq(collections?.filter(({ is_album }) => is_album))
)

export const getProfilePlaylists = createDeepEqualSelector(
  [getProfileCollections],
  (collections) => uniq(collections?.filter(({ is_album }) => !is_album))
)

const sortByDateDesc = (a: Collection, b: Collection) =>
  dayjs(b.created_at).diff(dayjs(a.created_at))

const sortBySaveCountDesc = (a: Collection, b: Collection) =>
  b.save_count - a.save_count

export const makeGetProfile = () => {
  return createDeepEqualSelector(
    [
      getProfileStatus,
      getProfileError,
      getProfileUserId,
      getIsSubscribed,
      getProfileCollectionSortMode,
      getProfileFollowers,
      getProfileFollowees,
      // External
      getUsers,
      getCollections
    ],
    (
      status,
      error,
      userId,
      isSubscribed,
      sortMode,
      followers,
      followees,
      users,
      collections
    ) => {
      const emptyState = {
        profile: null,
        playlists: null,
        albums: null,
        isSubscribed: false,
        status
      }
      if (error) return { ...emptyState, error: true }
      if (!userId) return emptyState
      if (!(userId in users)) return emptyState

      // Get playlists & albums.
      const c = (users[userId]._collectionIds || [])
        .map((id) =>
          id in collections ? collections[id as unknown as number] : null
        )
        .filter(removeNullable)

      // Filter out anything marked deleted on backend (is_delete) or locally (_marked_deleted)
      // Or locally moved playlists (_moved)
      let playlists = c.filter(
        (c) => !c.is_album && !(c.is_delete || c._marked_deleted) && !c._moved
      )
      let albums = c.filter(
        (c) => c.is_album && !(c.is_delete || c._marked_deleted) && !c._moved
      )

      if (sortMode === CollectionSortMode.SAVE_COUNT) {
        playlists = playlists.sort(sortBySaveCountDesc)
        albums = albums.sort(sortBySaveCountDesc)
      } else {
        playlists = playlists.sort(sortByDateDesc)
        albums = albums.sort(sortByDateDesc)
      }
      const followersPopulated =
        followers?.userIds
          .map(({ id }) => {
            if (id in users) return users[id]
            return null
          })
          .filter(removeNullable) ?? (emptyList as User[])

      const followeesPopulated =
        followees?.userIds
          .map(({ id }) => {
            if (id in users) return users[id]
            return null
          })
          .filter(removeNullable) ?? (emptyList as User[])

      const user = users[userId]
      return {
        profile: {
          ...user,
          followers: {
            status: followers?.status ?? Status.IDLE,
            users: followersPopulated
          },
          followees: {
            status: followees?.status ?? Status.IDLE,
            users: followeesPopulated
          }
        },
        playlists,
        albums,
        status,
        isSubscribed
      }
    }
  )
}

export const getTrackSource = (state: CommonState, handle: string) =>
  `${TRACKS_PREFIX}:${getProfileUserId(state, handle)}`
