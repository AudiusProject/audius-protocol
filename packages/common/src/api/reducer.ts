import { combineReducers } from 'redux'

import { userApiReducer } from './user'

export default combineReducers({
  userApi: userApiReducer
})
