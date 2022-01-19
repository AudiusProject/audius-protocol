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
import { TracksCacheState } from 'common/store/cache/tracks/types'
import usersReducer from 'common/store/cache/users/reducer'
import usersSagas from 'common/store/cache/users/sagas'
import { UsersCacheState } from 'common/store/cache/users/types'
import audioRewardsSlice from 'common/store/pages/audio-rewards/slice'
import tokenDashboardSlice from 'common/store/pages/token-dashboard/slice'
import track from 'common/store/pages/track/reducer'
import TrackPageState from 'common/store/pages/track/types'
import remoteConfigSagas from 'common/store/remote-config/sagas'
import addToPlaylistReducer, {
  AddToPlaylistState
} from 'common/store/ui/add-to-playlist/reducer'
import collectibleDetailsReducer, {
  CollectibleDetailsState
} from 'common/store/ui/collectible-details/slice'
import createPlaylistModalReducer from 'common/store/ui/createPlaylistModal/reducer'
import { CreatePlaylistModalState } from 'common/store/ui/createPlaylistModal/types'
import deletePlaylistConfirmationReducer from 'common/store/ui/delete-playlist-confirmation-modal/reducers'
import { DeletePlaylistConfirmationModalState } from 'common/store/ui/delete-playlist-confirmation-modal/types'
import mobileOverflowModalReducer from 'common/store/ui/mobile-overflow-menu/slice'
import { MobileOverflowModalState } from 'common/store/ui/mobile-overflow-menu/types'
import mobileUploadDrawerReducer, {
  MobileUploadDrawerState
} from 'common/store/ui/mobile-upload-drawer/slice'
import modalsReducer, { ModalsState } from 'common/store/ui/modals/slice'
import nowPlayingReducer, {
  NowPlayingState
} from 'common/store/ui/now-playing/slice'
import shareModalReducer from 'common/store/ui/share-modal/slice'
import { ShareModalState } from 'common/store/ui/share-modal/types'
import shareSoundToTikTokModalReducer from 'common/store/ui/share-sound-to-tiktok-modal/slice'
import { ShareSoundToTikTokModalState } from 'common/store/ui/share-sound-to-tiktok-modal/types'
import wallet from 'common/store/wallet/slice'

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

  // Wallet
  wallet,

  // UI
  ui: combineReducers({
    addToPlaylist: addToPlaylistReducer,
    createPlaylistModal: createPlaylistModalReducer,
    collectibleDetails: collectibleDetailsReducer,
    deletePlaylistConfirmationModal: deletePlaylistConfirmationReducer,
    mobileOverflowModal: mobileOverflowModalReducer,
    mobileUploadDrawer: mobileUploadDrawerReducer,
    modals: modalsReducer,
    nowPlaying: nowPlayingReducer,
    shareSoundToTikTokModal: shareSoundToTikTokModalReducer,
    shareModal: shareModalReducer
  }),

  // Pages
  pages: combineReducers({
    audioRewards: audioRewardsSlice.reducer,
    tokenDashboard: tokenDashboardSlice.reducer,
    track
  })
}

export const sagas = {
  cache: cacheSagas,
  collectionsError: collectionsErrorSagas,
  collections: collectionsSagas,
  tracks: tracksSagas,
  users: usersSagas,
  remoteConfig: remoteConfigSagas

  // TODO: pull in the following from audius-client
  // once AudiusBackend and dependencies are migrated
  // components/add-to-playlist/store/sagas.ts
  // components/share-sound-to-tiktok-modal/store/sagas.ts
  // store/social/tracks/sagas.ts
  // store/social/users/sagas.ts
  // store/social/collections/sagas.ts
  // pages/audio-rewards-page/store/sagas.ts
  // store/wallet/sagas.ts
  // store/lineup/sagas.js
  // pages/track/store/lineups/tracks/sagas.js
  // pages/track/store/sagas.js
}

export type CommonState = {
  account: ReturnType<typeof accountSlice.reducer>

  // Cache
  collections: Cache<Collection>
  tracks: TracksCacheState
  users: UsersCacheState

  // Wallet
  wallet: ReturnType<typeof wallet>

  ui: {
    addToPlaylist: AddToPlaylistState
    createPlaylistModal: CreatePlaylistModalState
    collectibleDetails: CollectibleDetailsState
    deletePlaylistConfirmationModal: DeletePlaylistConfirmationModalState
    mobileOverflowModal: MobileOverflowModalState
    mobileUploadDrawer: MobileUploadDrawerState
    modals: ModalsState
    nowPlaying: NowPlayingState
    shareSoundToTikTokModal: ShareSoundToTikTokModalState
    shareModal: ShareModalState
  }

  pages: {
    audioRewards: ReturnType<typeof audioRewardsSlice.reducer>
    tokenDashboard: ReturnType<typeof tokenDashboardSlice.reducer>
    track: TrackPageState
  }
}
