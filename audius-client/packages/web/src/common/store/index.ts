import { Kind, Cache, Collection } from '@audius/common'
import { combineReducers } from 'redux'

import accountSlice from 'common/store/account/reducer'
import averageColorReducer from 'common/store/average-color/slice'
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
import { sagas as castSagas } from 'common/store/cast/sagas'
import cast from 'common/store/cast/slice'
import changePasswordReducer, {
  ChangePasswordState
} from 'common/store/change-password/slice'
import notifications from 'common/store/notifications/reducer'
import audioRewardsSlice from 'common/store/pages/audio-rewards/slice'
import collection from 'common/store/pages/collection/reducer'
import { CollectionsPageState } from 'common/store/pages/collection/types'
import exploreCollectionsReducer from 'common/store/pages/explore/exploreCollections/slice'
import explorePageReducer from 'common/store/pages/explore/slice'
import feed from 'common/store/pages/feed/reducer'
import { FeedPageState } from 'common/store/pages/feed/types'
import historyPageReducer from 'common/store/pages/history-page/reducer'
import profileReducer from 'common/store/pages/profile/reducer'
import { ProfilePageState } from 'common/store/pages/profile/types'
import remixes from 'common/store/pages/remixes/slice'
import savedPageReducer from 'common/store/pages/saved-page/reducer'
import searchResults from 'common/store/pages/search-results/reducer'
import { SearchPageState } from 'common/store/pages/search-results/types'
import settings from 'common/store/pages/settings/reducer'
import { SettingsPageState } from 'common/store/pages/settings/types'
import smartCollection from 'common/store/pages/smart-collection/slice'
import tokenDashboardSlice from 'common/store/pages/token-dashboard/slice'
import track from 'common/store/pages/track/reducer'
import TrackPageState from 'common/store/pages/track/types'
import trendingPlaylists from 'common/store/pages/trending-playlists/slice'
import trendingUnderground from 'common/store/pages/trending-underground/slice'
import trending from 'common/store/pages/trending/reducer'
import { TrendingPageState } from 'common/store/pages/trending/types'
import queue from 'common/store/queue/slice'
import reachability from 'common/store/reachability/reducer'
import { ReachabilityState } from 'common/store/reachability/types'
import recoveryEmailSagas from 'common/store/recovery-email/sagas'
import remoteConfigSagas from 'common/store/remote-config/sagas'
import signOutSagas from 'common/store/sign-out/sagas'
import solanaReducer from 'common/store/solana/slice'
import stemsUpload from 'common/store/stems-upload/slice'
import tippingReducer from 'common/store/tipping/slice'
import addToPlaylistReducer, {
  AddToPlaylistState
} from 'common/store/ui/add-to-playlist/reducer'
import artistRecommendationsReducer, {
  ArtistRecommendationsState
} from 'common/store/ui/artist-recommendations/slice'
import collectibleDetailsReducer, {
  CollectibleDetailsState
} from 'common/store/ui/collectible-details/slice'
import createPlaylistModalReducer from 'common/store/ui/createPlaylistModal/reducer'
import { CreatePlaylistModalState } from 'common/store/ui/createPlaylistModal/types'
import deletePlaylistConfirmationReducer from 'common/store/ui/delete-playlist-confirmation-modal/slice'
import { DeletePlaylistConfirmationModalState } from 'common/store/ui/delete-playlist-confirmation-modal/types'
import mobileOverflowModalReducer from 'common/store/ui/mobile-overflow-menu/slice'
import { MobileOverflowModalState } from 'common/store/ui/mobile-overflow-menu/types'
import modalsReducer, { ModalsState } from 'common/store/ui/modals/slice'
import nowPlayingReducer, {
  NowPlayingState
} from 'common/store/ui/now-playing/slice'
import reactionsReducer, {
  ReactionsState
} from 'common/store/ui/reactions/slice'
import shareModalReducer from 'common/store/ui/share-modal/slice'
import { ShareModalState } from 'common/store/ui/share-modal/types'
import shareSoundToTikTokModalReducer from 'common/store/ui/share-sound-to-tiktok-modal/slice'
import { ShareSoundToTikTokModalState } from 'common/store/ui/share-sound-to-tiktok-modal/types'
import theme from 'common/store/ui/theme/reducer'
import { ThemeState } from 'common/store/ui/theme/types'
import toastReducer, { ToastState } from 'common/store/ui/toast/slice'
import favoritesUserListReducer from 'common/store/user-list/favorites/reducers'
import followersUserListReducer from 'common/store/user-list/followers/reducers'
import followingUserListReducer from 'common/store/user-list/following/reducers'
import mutualsUserListReducer from 'common/store/user-list/mutuals/reducers'
import notificationsUserListReducer from 'common/store/user-list/notifications/reducers'
import repostsUserListReducer from 'common/store/user-list/reposts/reducers'
import supportingUserListReducer from 'common/store/user-list/supporting/reducers'
import topSupportersUserListReducer from 'common/store/user-list/top-supporters/reducers'
import wallet from 'common/store/wallet/slice'

// In the future, these state slices will live in packages/common.
// For now they live in the web client. As features get migrated to RN
// relevant state slices should be added here. Eventually they will be pulled into
// packages/common and the mobile client will no longer be dependent on the web client

export type CommonStoreContext = {
  getLocalStorageItem: (key: string) => Promise<string | null>
  setLocalStorageItem: (key: string, value: string) => Promise<void>
}

/**
 * A function that creates common reducers. The function takes
 * a CommonStoreContext as input such that platforms (native and web)
 * may specify system-level APIs, e.g. local storage.
 * @param ctx
 * @returns an object of all reducers to be used with `combineReducers`
 */
export const reducers = (ctx: CommonStoreContext) => ({
  account: accountSlice.reducer,

  // Config
  reachability,

  // Cache
  collections: asCache(collectionsReducer, Kind.COLLECTIONS),
  tracks: asCache(tracksReducer, Kind.TRACKS),
  users: asCache(usersReducer, Kind.USERS),

  // Playback
  queue,

  // Wallet
  wallet,

  // Cast
  cast,

  // UI
  ui: combineReducers({
    averageColor: averageColorReducer,
    addToPlaylist: addToPlaylistReducer,
    artistRecommendations: artistRecommendationsReducer,
    changePassword: changePasswordReducer,
    createPlaylistModal: createPlaylistModalReducer,
    collectibleDetails: collectibleDetailsReducer,
    deletePlaylistConfirmationModal: deletePlaylistConfirmationReducer,
    mobileOverflowModal: mobileOverflowModalReducer,
    modals: modalsReducer,
    nowPlaying: nowPlayingReducer,
    reactions: reactionsReducer,
    shareSoundToTikTokModal: shareSoundToTikTokModalReducer,
    shareModal: shareModalReducer,
    toast: toastReducer,
    userList: combineReducers({
      followers: followersUserListReducer,
      following: followingUserListReducer,
      reposts: repostsUserListReducer,
      favorites: favoritesUserListReducer,
      mutuals: mutualsUserListReducer,
      notifications: notificationsUserListReducer,
      topSupporters: topSupportersUserListReducer,
      supporting: supportingUserListReducer
    }),
    theme
  }),

  // Pages
  pages: combineReducers({
    audioRewards: audioRewardsSlice.reducer,
    collection,
    feed,
    explore: explorePageReducer,
    exploreCollections: exploreCollectionsReducer,
    historyPage: historyPageReducer,
    profile: profileReducer,
    smartCollection,
    savedPage: savedPageReducer,
    searchResults,
    tokenDashboard: tokenDashboardSlice.reducer,
    track,
    trending,
    trendingPlaylists,
    trendingUnderground,
    settings,
    notifications,
    remixes
  }),

  // Solana
  solana: solanaReducer,

  stemsUpload,

  // Tipping
  tipping: tippingReducer
})

/**
 * A function that creates common sagas. The function takes
 * a CommonStoreContext as input such that platforms (native and web)
 * may specify system-level APIs, e.g. local storage.
 * @param ctx
 * @returns an object of all sagas to be yielded
 */
export const sagas = (ctx: CommonStoreContext) => ({
  cache: cacheSagas,
  collectionsError: collectionsErrorSagas,
  collections: collectionsSagas,
  tracks: tracksSagas,
  users: usersSagas,
  remoteConfig: remoteConfigSagas,
  cast: castSagas(ctx),
  signOut: signOutSagas,
  recoveryEmail: recoveryEmailSagas
  // TODO:
  // pull in the following from web
  // once AudiusBackend and dependencies are migrated
  // common/store/pages/explore/exploreCollections/sagas.ts
  // common/store/pages/explore/sagas.ts
  // components/add-to-playlist/store/sagas.ts
  // components/share-sound-to-tiktok-modal/store/sagas.ts
  // store/social/tracks/sagas.ts
  // store/social/users/sagas.ts
  // store/social/collections/sagas.ts
  // pages/audio-rewards-page/store/sagas.ts
  // store/wallet/sagas.ts
  // store/lineup/sagas.js
  // pages/feed/store/lineups/feed/sagas.js
  // pages/feed/store/sagas.js
  // pages/collection/store/lineups/tracks/sagas.js
  // pages/collection/store/sagas.js
  // pages/track/store/lineups/tracks/sagas.js
  // pages/track/store/sagas.js
  // store/ui/stemsUpload/sagas.ts
  // pages/user-list/followers/sagas.ts
  // pages/user-list/following/sagas.ts
  // pages/user-list/reposts/sagas.ts
  // pages/user-list/favorites/sagas.ts
  // pages/user-list/mutuals/sagas.ts
  // pages/user-list/supporting/sagas.ts
  // pages/user-list/top-supporters/sagas.ts
  // pages/explore-page/store/sagas.ts
  // pages/explore-page/store/exploreCollections/sagas.ts
  // store/solana/sagas.ts
  // pages/trending-page/store/sagas.ts
  // pages/trending-page/store/lineups/trending/sagas.ts
  // pages/trending-underground-page/store/lineups/tracks/sagas.ts
  // pages/trending-underground-page/store/sagas.ts
  // pages/smart-collection/store/sagas.ts
  // store/application/ui/theme/sagas.ts
  // pages/search-page/store/sagas.ts
  // pages/search-page/store/lineups/tracks/sagas.ts
  // notifications/store/sagas.ts
  // notifications/store/mobileSagas.ts
  // pages/remixes-page/store/sagas.ts
  // pages/remixes-page/store/lineups/tracks/sagas.ts
  //
  // pull in the following from web
  // once the player and dependencies are migrated
  // store/queue/sagas.ts
})

export type CommonState = {
  account: ReturnType<typeof accountSlice.reducer>

  // Config
  reachability: ReachabilityState

  // Cache
  collections: Cache<Collection>
  tracks: TracksCacheState
  users: UsersCacheState

  // Playback
  queue: ReturnType<typeof queue>

  // Wallet
  wallet: ReturnType<typeof wallet>

  // Cast
  cast: ReturnType<typeof cast>

  ui: {
    averageColor: ReturnType<typeof averageColorReducer>
    addToPlaylist: AddToPlaylistState
    artistRecommendations: ArtistRecommendationsState
    changePassword: ChangePasswordState
    createPlaylistModal: CreatePlaylistModalState
    collectibleDetails: CollectibleDetailsState
    deletePlaylistConfirmationModal: DeletePlaylistConfirmationModalState
    mobileOverflowModal: MobileOverflowModalState
    modals: ModalsState
    nowPlaying: NowPlayingState
    reactions: ReactionsState
    shareSoundToTikTokModal: ShareSoundToTikTokModalState
    shareModal: ShareModalState
    toast: ToastState
    userList: {
      followers: ReturnType<typeof followersUserListReducer>
      following: ReturnType<typeof followingUserListReducer>
      reposts: ReturnType<typeof repostsUserListReducer>
      favorites: ReturnType<typeof favoritesUserListReducer>
      mutuals: ReturnType<typeof mutualsUserListReducer>
      notifications: ReturnType<typeof notificationsUserListReducer>
      topSupporters: ReturnType<typeof topSupportersUserListReducer>
      supporting: ReturnType<typeof supportingUserListReducer>
    }
    theme: ThemeState
  }

  pages: {
    audioRewards: ReturnType<typeof audioRewardsSlice.reducer>
    collection: CollectionsPageState
    feed: FeedPageState
    explore: ReturnType<typeof explorePageReducer>
    exploreCollections: ReturnType<typeof exploreCollectionsReducer>
    smartCollection: ReturnType<typeof smartCollection>
    tokenDashboard: ReturnType<typeof tokenDashboardSlice.reducer>
    historyPage: ReturnType<typeof historyPageReducer>
    track: TrackPageState
    profile: ProfilePageState
    savedPage: ReturnType<typeof savedPageReducer>
    searchResults: SearchPageState
    settings: SettingsPageState
    trending: TrendingPageState
    trendingPlaylists: ReturnType<typeof trendingPlaylists>
    trendingUnderground: ReturnType<typeof trendingUnderground>
    notifications: ReturnType<typeof notifications>
    remixes: ReturnType<typeof remixes>
  }

  solana: ReturnType<typeof solanaReducer>

  stemsUpload: ReturnType<typeof stemsUpload>

  // Tipping
  tipping: ReturnType<typeof tippingReducer>
}
