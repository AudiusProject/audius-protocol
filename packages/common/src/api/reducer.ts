import { combineReducers } from 'redux'

import { accountApiReducer } from './account'
import { authorizedAppsApiReducer } from './authorizedApps'
import { collectionApiReducer } from './collection'
import { developerAppsApiReducer } from './developerApps'
import { favoritesApiReducer } from './favorites'
import { libraryApiReducer } from './library'
import { purchasesApiReducer } from './purchases'
import { searchApiReducer } from './search'
import { signUpReducer } from './signUp'
import { topArtistsApiReducer } from './topArtists'
import { trackApiReducer } from './track'
import { trendingApiReducer } from './trending'
import { userApiReducer } from './user'

export default combineReducers({
  accountApi: accountApiReducer,
  authorizedAppsApi: authorizedAppsApiReducer,
  collectionApi: collectionApiReducer,
  developerAppsApi: developerAppsApiReducer,
  favoritesApi: favoritesApiReducer,
  libraryApi: libraryApiReducer,
  purchasesApi: purchasesApiReducer,
  searchApi: searchApiReducer,
  signUpApi: signUpReducer,
  topArtistsApi: topArtistsApiReducer,
  trackApi: trackApiReducer,
  trendingApi: trendingApiReducer,
  userApi: userApiReducer
})
