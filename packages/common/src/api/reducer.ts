import { combineReducers } from 'redux'

import { accountApiReducer } from './account'
import { authorizedAppsApiReducer } from './authorizedApps'
import { developerAppsApiReducer } from './developerApps'
import { favoritesApiReducer } from './favorites'
import { searchApiReducer } from './search'
import { signUpReducer } from './signUp'
import { trendingApiReducer } from './trending'
import { userApiReducer } from './user'

export default combineReducers({
  accountApi: accountApiReducer,
  authorizedAppsApi: authorizedAppsApiReducer,
  developerAppsApi: developerAppsApiReducer,
  favoritesApi: favoritesApiReducer,
  searchApi: searchApiReducer,
  signUpApi: signUpReducer,
  trendingApi: trendingApiReducer,
  userApi: userApiReducer
})
