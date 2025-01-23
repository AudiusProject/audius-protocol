import { combineReducers } from 'redux'

import { accountApiReducer } from './account'
import { developerAppsApiReducer } from './developerApps'
import { libraryApiReducer } from './library'
import { searchApiReducer } from './search'
import { userApiReducer } from './user'

export default combineReducers({
  accountApi: accountApiReducer,
  developerAppsApi: developerAppsApiReducer,
  libraryApi: libraryApiReducer,
  searchApi: searchApiReducer,
  userApi: userApiReducer
})
