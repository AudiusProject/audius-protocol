import { combineReducers } from 'redux'

import { favoritesApiReducer } from './favorites'
import { libraryApiReducer } from './library'
import { trendingApiReducer } from './trending'
import { userApiReducer } from './user'

export default combineReducers({
  favoritesApi: favoritesApiReducer,
  libraryApi: libraryApiReducer,
  trendingApi: trendingApiReducer,
  userApi: userApiReducer
})
