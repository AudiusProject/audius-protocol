import { combineReducers } from 'redux'

import { Kind, Cache, Collection } from '../models'

import accountSlice from './account/slice'
import averageColorReducer from './average-color/slice'
import collectionsReducer from './cache/collections/reducer'
import { asCache } from './cache/reducer'
import tracksReducer from './cache/tracks/reducer'
import { TracksCacheState } from './cache/tracks/types'
import usersReducer from './cache/users/reducer'
import { UsersCacheState } from './cache/users/types'
import cast from './cast/slice'
import changePasswordReducer from './change-password/slice'
import { ChangePasswordState } from './change-password/types'
import notifications from './notifications/reducer'
import audioRewardsSlice from './pages/audio-rewards/slice'
import collection from './pages/collection/reducer'
import { CollectionsPageState } from './pages/collection/types'
import exploreCollectionsReducer from './pages/explore/exploreCollections/slice'
import explorePageReducer from './pages/explore/slice'
import feed from './pages/feed/reducer'
import { FeedPageState } from './pages/feed/types'
import historyPageReducer from './pages/history-page/reducer'
import profileReducer from './pages/profile/reducer'
import { ProfilePageState } from './pages/profile/types'
import remixes from './pages/remixes/slice'
import savedPageReducer from './pages/saved-page/reducer'
import searchResults from './pages/search-results/reducer'
import { SearchPageState } from './pages/search-results/types'
import settings from './pages/settings/reducer'
import { SettingsPageState } from './pages/settings/types'
import smartCollection from './pages/smart-collection/slice'
import tokenDashboardSlice from './pages/token-dashboard/slice'
import track from './pages/track/reducer'
import TrackPageState from './pages/track/types'
import trendingPlaylists from './pages/trending-playlists/slice'
import trendingUnderground from './pages/trending-underground/slice'
import trending from './pages/trending/reducer'
import { TrendingPageState } from './pages/trending/types'
import player, { PlayerState } from './player/slice'
import queue from './queue/slice'
import reachability from './reachability/reducer'
import { ReachabilityState } from './reachability/types'
import { recoveryEmailReducer, RecoveryEmailState } from './recovery-email'
import solanaReducer from './solana/slice'
import stemsUpload from './stems-upload/slice'
import tippingReducer from './tipping/slice'
import { ToastState, TransactionDetailsState } from './ui'
import addToPlaylistReducer, {
  AddToPlaylistState
} from './ui/add-to-playlist/reducer'
import artistRecommendationsReducer, {
  ArtistRecommendationsState
} from './ui/artist-recommendations/slice'
import buyAudioReducer from './ui/buy-audio/slice'
import collectibleDetailsReducer, {
  CollectibleDetailsState
} from './ui/collectible-details/slice'
import createPlaylistModalReducer from './ui/createPlaylistModal/reducer'
import { CreatePlaylistModalState } from './ui/createPlaylistModal/types'
import deletePlaylistConfirmationReducer from './ui/delete-playlist-confirmation-modal/slice'
import { DeletePlaylistConfirmationModalState } from './ui/delete-playlist-confirmation-modal/types'
import mobileOverflowModalReducer from './ui/mobile-overflow-menu/slice'
import { MobileOverflowModalState } from './ui/mobile-overflow-menu/types'
import modalsReducer from './ui/modals/slice'
import { ModalsState } from './ui/modals/types'
import nowPlayingReducer, { NowPlayingState } from './ui/now-playing/slice'
import reactionsReducer, { ReactionsState } from './ui/reactions/slice'
import shareModalReducer from './ui/share-modal/slice'
import { ShareModalState } from './ui/share-modal/types'
import shareSoundToTikTokModalReducer from './ui/share-sound-to-tiktok-modal/slice'
import { ShareSoundToTikTokModalState } from './ui/share-sound-to-tiktok-modal/types'
import theme, { ThemeState } from './ui/theme/slice'
import toastReducer from './ui/toast/slice'
import transactionDetailsReducer from './ui/transaction-details/slice'
import vipDiscordModalReducer from './ui/vip-discord-modal/slice'
import { VipDiscordModalState } from './ui/vip-discord-modal/types'
import favoritesUserListReducer from './user-list/favorites/reducers'
import followersUserListReducer from './user-list/followers/reducers'
import followingUserListReducer from './user-list/following/reducers'
import mutualsUserListReducer from './user-list/mutuals/reducers'
import notificationsUserListReducer from './user-list/notifications/reducers'
import repostsUserListReducer from './user-list/reposts/reducers'
import supportingUserListReducer from './user-list/supporting/reducers'
import topSupportersUserListReducer from './user-list/top-supporters/reducers'
import wallet from './wallet/slice'

/**
 * A function that creates common reducers. The function takes
 * a CommonStoreContext as input such that platforms (native and web)
 * may specify system-level APIs, e.g. local storage.
 * @returns an object of all reducers to be used with `combineReducers`
 */
export const reducers = () => ({
  account: accountSlice.reducer,

  // TODO: Move to common
  // signOn: signOnReducer,
  // backend,
  // confirmer,

  // Config
  reachability,

  // Cache
  collections: asCache(collectionsReducer, Kind.COLLECTIONS),
  // TODO: Fix type error
  // @ts-ignore
  tracks: asCache(tracksReducer, Kind.TRACKS),
  // TODO: Fix type error
  // @ts-ignore
  users: asCache(usersReducer, Kind.USERS),

  // Playback
  queue,
  player,

  // Wallet
  wallet,

  // Cast
  cast,

  // UI
  ui: combineReducers({
    averageColor: averageColorReducer,
    addToPlaylist: addToPlaylistReducer,
    buyAudio: buyAudioReducer,

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
    transactionDetails: transactionDetailsReducer,
    userList: combineReducers({
      followers: followersUserListReducer,
      following: followingUserListReducer,
      reposts: repostsUserListReducer,
      favorites: favoritesUserListReducer,
      topSupporters: topSupportersUserListReducer,
      supporting: supportingUserListReducer,
      mutuals: mutualsUserListReducer,
      notifications: notificationsUserListReducer
    }),
    theme,
    vipDiscordModal: vipDiscordModalReducer,
    recoveryEmail: recoveryEmailReducer
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

export type CommonState = {
  account: ReturnType<typeof accountSlice.reducer>
  // TODO: Migrate to common
  // signOn: ReturnType<typeof signOnReducer>

  // TODO: Migrate to common
  // backend: BackendState

  // Config
  reachability: ReachabilityState

  // TODO: Migrate to common
  // confirmer: ConfirmerState

  // Cache
  collections: Cache<Collection>
  tracks: TracksCacheState
  users: UsersCacheState

  // Playback
  queue: ReturnType<typeof queue>
  player: PlayerState

  // Wallet
  wallet: ReturnType<typeof wallet>

  // Cast
  cast: ReturnType<typeof cast>

  ui: {
    averageColor: ReturnType<typeof averageColorReducer>
    buyAudio: ReturnType<typeof buyAudioReducer>
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
    transactionDetails: TransactionDetailsState
    userList: {
      mutuals: ReturnType<typeof mutualsUserListReducer>
      notifications: ReturnType<typeof notificationsUserListReducer>
      followers: ReturnType<typeof followersUserListReducer>
      following: ReturnType<typeof followingUserListReducer>
      reposts: ReturnType<typeof repostsUserListReducer>
      favorites: ReturnType<typeof favoritesUserListReducer>
      topSupporters: ReturnType<typeof topSupportersUserListReducer>
      supporting: ReturnType<typeof supportingUserListReducer>
    }
    theme: ThemeState
    vipDiscordModal: VipDiscordModalState
    recoveryEmail: RecoveryEmailState
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
