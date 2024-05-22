import { History } from 'history'
import { combineReducers } from 'redux'
import type { Storage } from 'redux-persist'

import account from '~/store/account/slice'
import collectionsReducer from '~/store/cache/collections/reducer'
import { asCache } from '~/store/cache/reducer'
import tracksReducer from '~/store/cache/tracks/reducer'
import usersReducer from '~/store/cache/users/reducer'
// import collection from '~/store/pages/collection/reducer'
// import profileReducer from '~/store/pages/profile/reducer'
import track from '~/store/pages/track/reducer'
import theme from '~/store/ui/theme/slice'

// import { Kind, SsrPageProps } from '../models'

/**
 * A function that creates common reducers.
 * @returns an object of all reducers to be used with `combineReducers`
 */
export const serverReducers = (
  _storage: Storage,
  // ssrPageProps?: SsrPageProps,
  ssrPageProps?: any,
  _isServerSide?: boolean,
  _history?: History
) => ({
  account,

  // Cache
  // @ts-ignore
  // collections: asCache(collectionsReducer(ssrPageProps), Kind.COLLECTIONS),
  collections: asCache(collectionsReducer(ssrPageProps), 'COLLECTIONS'),
  // @ts-ignore
  // tracks: asCache(tracksReducer(ssrPageProps), Kind.TRACKS),
  tracks: asCache(tracksReducer(ssrPageProps), 'TRACKS'),
  // @ts-ignore
  // users: asCache(usersReducer(ssrPageProps), Kind.USERS),
  users: asCache(usersReducer(ssrPageProps), 'USERS'),

  // UI
  ui: combineReducers({
    theme
  }),

  // Pages
  pages: combineReducers({
    // collection: collection(ssrPageProps),
    // profile: profileReducer(ssrPageProps),
    track: track(ssrPageProps)
  })
})
