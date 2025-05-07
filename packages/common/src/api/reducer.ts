import { combineReducers } from 'redux'

import { accountApiReducer } from './account'
import { favoritesApiReducer } from './favorites'
import { libraryApiReducer } from './library'
import { signUpReducer } from './signUp'
import { trendingApiReducer } from './trending'
import { userApiReducer } from './user'

export default combineReducers({
  accountApi: accountApiReducer,
  favoritesApi: favoritesApiReducer,
  libraryApi: libraryApiReducer,
  signUpApi: signUpReducer,
  trendingApi: trendingApiReducer,
  userApi: userApiReducer
})
