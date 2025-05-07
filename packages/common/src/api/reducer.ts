import { combineReducers } from 'redux'

import { accountApiReducer } from './account'
import { authorizedAppsApiReducer } from './authorizedApps'
import { favoritesApiReducer } from './favorites'
import { libraryApiReducer } from './library'
import { searchApiReducer } from './search'
import { signUpReducer } from './signUp'
import { trendingApiReducer } from './trending'
import { userApiReducer } from './user'

export default combineReducers({
  accountApi: accountApiReducer,
  authorizedAppsApi: authorizedAppsApiReducer,
  favoritesApi: favoritesApiReducer,
  libraryApi: libraryApiReducer,
  searchApi: searchApiReducer,
  signUpApi: signUpReducer,
  trendingApi: trendingApiReducer,
  userApi: userApiReducer
})
