import { createSelector } from 'reselect'

import { getCollections } from 'store/cache/collections/selectors'
import { getUsers } from 'store/cache/users/selectors'
import { CommonState } from 'store/commonStore'

import { UserCollection, Status, User } from '../../../models'
import { removeNullable } from '../../../utils'

const getExplore = (state: CommonState) => state.pages.explore

export const getExplorePlaylists = createSelector(
  (state: CommonState) => state.pages.explore.playlists,
  (state: CommonState) => state.collections.entries,
  (playlists, collections) =>
    playlists.map((id) => collections[id].metadata).filter(removeNullable)
)

export const getExploreArtists = createSelector(
  (state: CommonState) => state.pages.explore.profiles,
  (state: CommonState) => state.users.entries,
  (artists, users) =>
    artists.map((id) => users[id].metadata).filter(removeNullable)
)

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
