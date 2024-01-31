import { createSelector } from 'reselect'

import { getCollections } from '~/store/cache/collections/selectors'
import { getUsers } from '~/store/cache/users/selectors'
import { CommonState } from '~/store/commonStore'

import { UserCollection, Status, User } from '../../../models'
import { removeNullable } from '../../../utils'

const getExplore = (state: CommonState) => state.pages.explore

export const getPlaylistIds = (state: CommonState) =>
  getExplore(state).playlists

export const getProfileIds = (state: CommonState) => getExplore(state).profiles

export const getExplorePlaylists = createSelector(
  getPlaylistIds,
  (state: CommonState) => state.collections.entries,
  (playlists, collections) =>
    playlists.map((id) => collections[id]?.metadata).filter(removeNullable)
)

export const getExploreArtists = createSelector(
  getProfileIds,
  (state: CommonState) => state.users.entries,
  (artists, users) =>
    artists.map((id) => users[id]?.metadata).filter(removeNullable)
)

export const getExploreStatus = (state: CommonState) => getExplore(state).status
export const getPlaylistsStatus = (state: CommonState) =>
  getExplore(state).playlistsStatus
export const getArtistsStatus = (state: CommonState) =>
  getExplore(state).profilesStatus

export type GetExplore = {
  playlists: UserCollection[]
  profiles: User[]
  status: Status
}

export const makeGetExplore = () => {
  return createSelector(
    getExplore,
    getCollections,
    getUsers,
    (explore, collections, users) => {
      const playlists = explore.playlists
        .map((id) => collections[id])
        .filter(Boolean)
        .map((collection) => ({
          ...collection,
          user: users[collection.playlist_owner_id] || {}
        }))
      const profiles = explore.profiles.map((id) => users[id]).filter(Boolean)
      return {
        playlists,
        profiles,
        status: explore.status
      }
    }
  )
}

export const getTab = (state: CommonState) => state.pages.explore.tab
