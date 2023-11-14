import * as actions from './actions'
import * as collectionsActions from './collections/actions'
import * as collectionsSelectors from './collections/selectors'
import * as selectors from './selectors'
import * as tracksSelectors from './tracks/selectors'
import * as usersActions from './users/actions'
import * as combinedCacheUsersSelectors from './users/combinedSelectors'
import * as baseCacheUsersSelectors from './users/selectors'

export const cacheUsersSelectors = {
  ...baseCacheUsersSelectors,
  ...combinedCacheUsersSelectors
}

export const cacheActions = actions
export { CIDCache } from './CIDCache'
export const cacheCollectionsActions = collectionsActions
export { default as cacheCollectionsReducer } from './collections/reducer'
export const cacheCollectionsSelectors = collectionsSelectors
export {
  PlaylistOperations,
  EnhancedCollectionTrack,
  CollectionsCacheState,
  Image,
  EditPlaylistValues
} from './collections/types'
export { reformatCollection } from './collections/utils/reformatCollection'
export { CACHE_PRUNE_MIN } from './config'
export { mergeCustomizer, asCache } from './reducer'
export const cacheSelectors = selectors
export { default as cacheTracksReducer } from './tracks/reducer'
export const cacheTracksSelectors = tracksSelectors
export { TracksCacheState } from './tracks/types'
export { Metadata } from './types'
export const cacheUsersActions = usersActions
export {
  getUserFromTrack,
  getUserFromCollection
} from './users/combinedSelectors'
export { default as cacheUsersReducer } from './users/reducer'
export { UsersCacheState } from './users/types'
export { processAndCacheUsers, reformatUser } from './users/utils'
