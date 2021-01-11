import { createSelector } from 'reselect'

import { AppState, Status } from 'store/types'
import User from 'models/User'
import { UserCollection } from 'models/Collection'

import { getUsers } from 'store/cache/users/selectors'
import { getCollections } from 'store/cache/collections/selectors'

const getExplore = (state: AppState) => state.application.pages.explore

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
        .map(id => collections[id])
        .filter(Boolean)
        .map(collection => ({
          ...collection,
          user: users[collection.playlist_owner_id] || {}
        }))
      const profiles = explore.profiles.map(id => users[id]).filter(Boolean)
      return {
        playlists,
        profiles,
        status: explore.status
      }
    }
  )
}

export const getTab = (state: AppState) => state.application.pages.explore.tab
