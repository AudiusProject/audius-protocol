import { combineReducers } from 'redux'

import { accountApiReducer } from './account'
import { libraryApiReducer } from './library'
import { userApiReducer } from './user'

export default combineReducers({
  accountApi: accountApiReducer,
  libraryApi: libraryApiReducer,
  userApi: userApiReducer
})
