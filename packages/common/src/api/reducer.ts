import { combineReducers } from 'redux'

import { accountApiReducer } from './account'
import { collectionApiReducer } from './collection'
import { developerAppsApiReducer } from './developerApps'
import { favoritesApiReducer } from './favorites'
import { libraryApiReducer } from './library'
import { purchasesApiReducer } from './purchases'
import { relatedArtistsApiReducer } from './relatedArtists'
import { signUpReducer } from './signUp'
import { topArtistsApiReducer } from './topArtists'
import { trackApiReducer } from './track'
import { trendingApiReducer } from './trending'
import { userApiReducer } from './user'

export default combineReducers({
  collectionApi: collectionApiReducer,
  relatedArtistsApi: relatedArtistsApiReducer,
  trackApi: trackApiReducer,
  userApi: userApiReducer,
  developerAppsApi: developerAppsApiReducer,
  favoritesApi: favoritesApiReducer,
  trendingApi: trendingApiReducer,
  libraryApi: libraryApiReducer,
  purchasesApi: purchasesApiReducer,
  topArtistsApi: topArtistsApiReducer,
  accountApi: accountApiReducer,
  signUpApi: signUpReducer
})
