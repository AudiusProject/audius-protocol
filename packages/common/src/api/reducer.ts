import { combineReducers } from 'redux'

import relatedArtistsApi from './relatedArtists'
import trackApi from './track'
import userApi from './user'

export default combineReducers({
  relatedArtistsApi,
  trackApi,
  userApi
})
