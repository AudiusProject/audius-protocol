import moment from 'moment'
import { createSelector } from 'reselect'

import { CommonState } from 'common/store'
import { getCollections } from 'common/store/cache/collections/selectors'
import { getUser, getUsers } from 'common/store/cache/users/selectors'
import { removeNullable } from 'common/utils/typeUtils'

import { CollectionSortMode } from './types'

// Profile selectors
export const getProfileStatus = (state: CommonState) =>
  state.pages.profile.status
export const getProfileError = (state: CommonState) => state.pages.profile.error
export const getProfileUserId = (state: CommonState) =>
  state.pages.profile.userId
export const getProfileUserHandle = (state: CommonState) =>
  state.pages.profile.handle
export const getProfileMostUsedTags = (state: CommonState) =>
  state.pages.profile.mostUsedTags
export const getProfileCollectionSortMode = (state: CommonState) =>
  state.pages.profile.collectionSortMode
export const getProfileFollowers = (state: CommonState) =>
  state.pages.profile.followers
export const getProfileFollowees = (state: CommonState) =>
  state.pages.profile.followees
export const getFolloweeFollows = (state: CommonState) =>
  state.pages.profile.followeeFollows
export const getIsSubscribed = (state: CommonState) =>
  state.pages.profile.isNotificationSubscribed
export const getProfileUser = (state: CommonState) =>
  getUser(state, { id: getProfileUserId(state) })

export const getProfileFeedLineup = (state: CommonState) =>
  state.pages.profile.feed
export const getProfileTracksLineup = (state: CommonState) =>
  state.pages.profile.tracks

export const makeGetProfile = () => {
  return createSelector(
    [
      getProfileStatus,
      getProfileError,
      getProfileUserId,
      getIsSubscribed,
      getProfileCollectionSortMode,
      getProfileFollowers,
      getProfileFollowees,
      getFolloweeFollows,
      getProfileMostUsedTags,
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
      followeeFollows,
      mostUsedTags,
      users,
      collections
    ) => {
      const emptyState = {
        profile: null,
        playlists: null,
        albums: null,
        mostUsedTags: [],
        isSubscribed: false,
        status
      }
      if (error) return { ...emptyState, error: true }
      if (!(userId in users)) return emptyState

      // Get playlists & albums.
      const c = (users[userId]._collectionIds || [])
        .map(id =>
          id in collections ? collections[(id as unknown) as number] : null
        )
        .filter(removeNullable)

      // Filter out anything marked deleted on backend (is_delete) or locally (_marked_deleted)
      // Or locally moved playlists (_moved)
      let playlists = c.filter(
        c => (!c.is_album && !(c.is_delete || c._marked_deleted)) || c._moved
      )
      let albums = c.filter(
        c => (c.is_album && !(c.is_delete || c._marked_deleted)) || c._moved
      )

      if (sortMode === CollectionSortMode.SAVE_COUNT) {
        playlists = playlists.sort((a, b) => b.save_count - a.save_count)
        albums = albums.sort((a, b) => b.save_count - a.save_count)
      } else {
        // This is safe bc moment allows you to subtract timestamps, presumably by
        // overloading `valueOf
        playlists = playlists.sort(
          // @ts-ignore
          (a, b) => moment(b.created_at) - moment(a.created_at)
        )
        albums = albums.sort(
          // @ts-ignore
          (a, b) => moment(b.created_at) - moment(a.created_at)
        )
      }
      const followersPopulated = followers.userIds
        .map(({ id }) => {
          if (id in users) return users[id]
          return null
        })
        .filter(removeNullable)
      const followeesPopulated = followees.userIds
        .map(({ id }) => {
          if (id in users) return users[id]
          return null
        })
        .filter(removeNullable)
      const followeeFollowsPopulated = followeeFollows.userIds
        .map(({ id }) => {
          if (id in users) return users[id]
          return null
        })
        .filter(removeNullable)

      return {
        profile: {
          ...users[userId],
          followers: { status: followers.status, users: followersPopulated },
          followees: { status: followees.status, users: followeesPopulated },
          followeeFollows: {
            status: followeeFollows.status,
            users: followeeFollowsPopulated
          }
        },
        mostUsedTags,
        playlists,
        albums,
        status,
        isSubscribed
      }
    }
  )
}
