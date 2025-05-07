import { combineReducers } from 'redux'

import { accountApiReducer } from './account'
import { authorizedAppsApiReducer } from './authorizedApps'
import { developerAppsApiReducer } from './developerApps'
import { libraryApiReducer } from './library'
import { signUpReducer } from './signUp'
import { userApiReducer } from './user'

export default combineReducers({
  accountApi: accountApiReducer,
  authorizedAppsApi: authorizedAppsApiReducer,
  developerAppsApi: developerAppsApiReducer,
  libraryApi: libraryApiReducer,
  signUpApi: signUpReducer,
  userApi: userApiReducer
})
