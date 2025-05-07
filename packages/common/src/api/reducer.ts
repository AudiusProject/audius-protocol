import { combineReducers } from 'redux'

import { accountApiReducer } from './account'
import { authorizedAppsApiReducer } from './authorizedApps'
import { developerAppsApiReducer } from './developerApps'
import { favoritesApiReducer } from './favorites'
import { libraryApiReducer } from './library'
import { trendingApiReducer } from './trending'
import { userApiReducer } from './user'

export default combineReducers({
  accountApi: accountApiReducer,
  authorizedAppsApi: authorizedAppsApiReducer,
  developerAppsApi: developerAppsApiReducer,
  favoritesApi: favoritesApiReducer,
  libraryApi: libraryApiReducer,
  trendingApi: trendingApiReducer,
  userApi: userApiReducer
})
