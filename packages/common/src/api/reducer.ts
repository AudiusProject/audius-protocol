import { combineReducers } from 'redux'

import { favoritesApiReducer } from './favorites'
import { trendingApiReducer } from './trending'
import { userApiReducer } from './user'

export default combineReducers({
  favoritesApi: favoritesApiReducer,
  trendingApi: trendingApiReducer,
  userApi: userApiReducer
})
