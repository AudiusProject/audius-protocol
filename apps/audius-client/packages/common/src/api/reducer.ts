import { combineReducers } from 'redux'

import collectionApi from './collection'
import relatedArtistsApi from './relatedArtists'
import trackApi from './track'
import userApi from './user'

export default combineReducers({
  relatedArtistsApi,
  trackApi,
  collectionApi,
  userApi
})
