import { combineReducers } from 'redux'

import { accountApiReducer } from './account'
import { libraryApiReducer } from './library'
import { searchApiReducer } from './search'
import { userApiReducer } from './user'

export default combineReducers({
  accountApi: accountApiReducer,
  libraryApi: libraryApiReducer,
  searchApi: searchApiReducer,
  userApi: userApiReducer
})
