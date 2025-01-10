import { combineReducers } from 'redux'

import { accountApiReducer } from './account'
import { authorizedAppsApiReducer } from './authorizedApps'
import { developerAppsApiReducer } from './developerApps'
import { libraryApiReducer } from './library'
import { searchApiReducer } from './search'
import { trendingApiReducer } from './trending'
import { userApiReducer } from './user'

export default combineReducers({
  accountApi: accountApiReducer,
  authorizedAppsApi: authorizedAppsApiReducer,
  developerAppsApi: developerAppsApiReducer,
  libraryApi: libraryApiReducer,
  searchApi: searchApiReducer,
  trendingApi: trendingApiReducer,
  userApi: userApiReducer
})
