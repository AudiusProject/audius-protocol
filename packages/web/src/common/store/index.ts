import { combineReducers } from 'redux'

import Cache from 'common/models/Cache'
import { Collection } from 'common/models/Collection'
import Kind from 'common/models/Kind'
import accountSlice from 'common/store/account/reducer'
import collectionsErrorSagas from 'common/store/cache/collections/errorSagas'
import collectionsReducer from 'common/store/cache/collections/reducer'
import collectionsSagas from 'common/store/cache/collections/sagas'
import { asCache } from 'common/store/cache/reducer'
import cacheSagas from 'common/store/cache/sagas'
import tracksReducer from 'common/store/cache/tracks/reducer'
import tracksSagas from 'common/store/cache/tracks/sagas'
import TracksCacheState from 'common/store/cache/tracks/types'
import usersReducer from 'common/store/cache/users/reducer'
import usersSagas from 'common/store/cache/users/sagas'
import UserCacheState from 'common/store/cache/users/types'
import collectibleDetailsReducer, {
  CollectibleDetailsState
} from 'common/store/ui/collectible-details/slice'
import mobileOverflowModalReducer from 'common/store/ui/mobile-overflow-menu/reducer'
import { MobileOverflowModalState } from 'common/store/ui/mobile-overflow-menu/types'
import mobileUploadDrawerReducer, {
  MobileUploadDrawerState
} from 'common/store/ui/mobile-upload-drawer/slice'
import modalsReducer, { ModalsState } from 'common/store/ui/modals/slice'
import nowPlayingReducer, {
  NowPlayingState
} from 'common/store/ui/now-playing/slice'
import pushNotificationsDrawerReducer, {
  PushNotificationsDrawerState
} from 'common/store/ui/push-notifications-drawer/slice'

// In the future, these state slices will live in @audius/client-common.
// For now they live in the web client. As features get migrated to RN
// relevant state slices should be added here. Eventually they will be pulled into
// @audius/client-common and the mobile client will no longer be dependent on the web client

export const reducers = {
  account: accountSlice.reducer,

  // Cache
  collections: asCache(collectionsReducer, Kind.COLLECTIONS),
  tracks: asCache(tracksReducer, Kind.TRACKS),
  users: asCache(usersReducer, Kind.USERS),

  // UI
  ui: combineReducers({
    collectibleDetails: collectibleDetailsReducer,
    enablePushNotificationsDrawer: pushNotificationsDrawerReducer,
    mobileOverflowModal: mobileOverflowModalReducer,
    mobileUploadDrawer: mobileUploadDrawerReducer,
    modals: modalsReducer,
    nowPlaying: nowPlayingReducer
  })
}

export const sagas = {
  cache: cacheSagas,
  collectionsError: collectionsErrorSagas,
  collections: collectionsSagas,
  tracks: tracksSagas,
  users: usersSagas
}

export type CommonState = {
  account: ReturnType<typeof accountSlice.reducer>

  // Cache
  collections: Cache<Collection>
  tracks: TracksCacheState
  users: UserCacheState

  ui: {
    collectibleDetails: CollectibleDetailsState
    enablePushNotificationsDrawer: PushNotificationsDrawerState
    mobileOverflowModal: MobileOverflowModalState
    mobileUploadDrawer: MobileUploadDrawerState
    modals: ModalsState
    nowPlaying: NowPlayingState
  }
}
