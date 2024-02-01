import { History } from 'history'
import { combineReducers } from 'redux'
import type { Storage } from 'redux-persist'

import { SsrPageProps } from '~/models/SsrPageProps'

import apiReducer from '../api/reducer'
import { Kind } from '../models'

import account from './account/slice'
import averageColorReducer from './average-color/slice'
import { buyCryptoReducer } from './buy-crypto'
import { buyUSDCReducer } from './buy-usdc'
import collectionsReducer from './cache/collections/reducer'
import { CollectionsCacheState } from './cache/collections/types'
import { asCache } from './cache/reducer'
import tracksReducer from './cache/tracks/reducer'
import { TracksCacheState } from './cache/tracks/types'
import usersReducer from './cache/users/reducer'
import { UsersCacheState } from './cache/users/types'
import cast from './cast/slice'
import changePasswordReducer from './change-password/slice'
import { ChangePasswordState } from './change-password/types'
import collectibles from './collectibles/slice'
import confirmer from './confirmer/reducer'
import { ConfirmerState } from './confirmer/types'
import gatedContent from './gated-content/slice'
import musicConfettiReducer, {
  MusicConfettiState
} from './music-confetti/slice'
import { NotificationsState, notificationsReducer } from './notifications'
import { HistoryPageState, SavedPageState } from './pages'
import ai from './pages/ai/slice'
import audioRewardsSlice from './pages/audio-rewards/slice'
import audioTransactionsSlice from './pages/audio-transactions/slice'
import { chatReducer } from './pages/chat'
import collection from './pages/collection/reducer'
import { CollectionsPageState } from './pages/collection/types'
import {
  deactivateAccountReducer,
  DeactivateAccountState
} from './pages/deactivate-account'
import exploreCollectionsReducer from './pages/explore/exploreCollections/slice'
import explorePageReducer from './pages/explore/slice'
import feed from './pages/feed/reducer'
import { FeedPageState } from './pages/feed/types'
import historyPageReducer from './pages/history-page/reducer'
import premiumTracks from './pages/premium-tracks/slice'
import profileReducer from './pages/profile/reducer'
import { ProfilePageState } from './pages/profile/types'
import remixes from './pages/remixes/slice'
import {
  savePageReducer,
  persistedSavePageReducer
} from './pages/saved-page/reducer'
import searchResults from './pages/search-results/reducer'
import { SearchPageState } from './pages/search-results/types'
import settings from './pages/settings/reducer'
import { SettingsPageState } from './pages/settings/types'
import smartCollection from './pages/smart-collection/slice'
import tokenDashboardSlice from './pages/token-dashboard/slice'
import track from './pages/track/reducer'
import { TrackPageState } from './pages/track/types'
import trending from './pages/trending/reducer'
import { TrendingPageState } from './pages/trending/types'
import trendingPlaylists from './pages/trending-playlists/slice'
import trendingUnderground from './pages/trending-underground/slice'
import { PlaybackPositionState } from './playback-position'
import playbackPosition from './playback-position/slice'
import player, { PlayerState } from './player/slice'
import {
  playlistLibraryReducer,
  PlaylistLibraryState
} from './playlist-library'
import { playlistUpdatesReducer, PlaylistUpdateState } from './playlist-updates'
import { purchaseContentReducer } from './purchase-content'
import queue from './queue/slice'
import reachability from './reachability/reducer'
import { ReachabilityState } from './reachability/types'
import { recoveryEmailReducer, RecoveryEmailState } from './recovery-email'
import remixSettingsReducer, {
  RemixSettingsState
} from './remix-settings/slice'
import savedCollectionsReducer from './saved-collections/slice'
import solanaReducer from './solana/slice'
import stemsUpload from './stems-upload/slice'
import tippingReducer from './tipping/slice'
import {
  searchUsersModalReducer,
  SearchUsersModalState,
  ToastState,
  TransactionDetailsState,
  withdrawUSDCReducer
} from './ui'
import addToCollectionReducer, {
  AddToCollectionState
} from './ui/add-to-collection/reducer'
import buyAudioReducer from './ui/buy-audio/slice'
import coinflowModalReducer from './ui/coinflow-modal/slice'
import collectibleDetailsReducer, {
  CollectibleDetailsState
} from './ui/collectible-details/slice'
import deletePlaylistConfirmationReducer from './ui/delete-playlist-confirmation-modal/slice'
import { DeletePlaylistConfirmationModalState } from './ui/delete-playlist-confirmation-modal/types'
import duplicateAddConfirmationReducer from './ui/duplicate-add-confirmation-modal/slice'
import { DuplicateAddConfirmationModalState } from './ui/duplicate-add-confirmation-modal/types'
import mobileOverflowModalReducer from './ui/mobile-overflow-menu/slice'
import { MobileOverflowModalState } from './ui/mobile-overflow-menu/types'
import { modalsReducer, ModalsState } from './ui/modals'
import nowPlayingReducer, { NowPlayingState } from './ui/now-playing/slice'
import publishPlaylistConfirmationReducer from './ui/publish-playlist-confirmation-modal/slice'
import { PublishPlaylistConfirmationModalState } from './ui/publish-playlist-confirmation-modal/types'
import publishTrackConfirmationReducer from './ui/publish-track-confirmation-modal/slice'
import { PublishTrackConfirmationModalState } from './ui/publish-track-confirmation-modal/types'
import reactionsReducer, { ReactionsState } from './ui/reactions/slice'
import relatedArtistsReducer from './ui/related-artists/slice'
import { RelatedArtistsState } from './ui/related-artists/types'
import shareModalReducer from './ui/share-modal/slice'
import { ShareModalState } from './ui/share-modal/types'
import shareSoundToTikTokModalReducer from './ui/share-sound-to-tiktok-modal/slice'
import { ShareSoundToTikTokModalState } from './ui/share-sound-to-tiktok-modal/types'
import stripeModalReducer from './ui/stripe-modal/slice'
import { StripeModalState } from './ui/stripe-modal/types'
import theme, { ThemeState } from './ui/theme/slice'
import toastReducer from './ui/toast/slice'
import transactionDetailsReducer from './ui/transaction-details/slice'
import uploadConfirmationReducer from './ui/upload-confirmation-modal/slice'
import { UploadConfirmationModalState } from './ui/upload-confirmation-modal/types'
import vipDiscordModalReducer from './ui/vip-discord-modal/slice'
import { VipDiscordModalState } from './ui/vip-discord-modal/types'
import upload from './upload/reducer'
import { UploadState } from './upload/types'
import favoritesUserListReducer from './user-list/favorites/reducers'
import followersUserListReducer from './user-list/followers/reducers'
import followingUserListReducer from './user-list/following/reducers'
import mutualsUserListReducer from './user-list/mutuals/reducers'
import notificationsUserListReducer from './user-list/notifications/reducers'
import relatedArtistsListReducer from './user-list/related-artists/reducers'
import repostsUserListReducer from './user-list/reposts/reducers'
import supportingUserListReducer from './user-list/supporting/reducers'
import topSupportersUserListReducer from './user-list/top-supporters/reducers'
import wallet from './wallet/slice'

/**
 * A function that creates common reducers.
 * @returns an object of all reducers to be used with `combineReducers`
 */
export const reducers = (
  storage: Storage,
  ssrPageProps?: SsrPageProps,
  isServerSide?: boolean,
  history?: History
) => ({
  account,

  api: apiReducer,

  // TODO: Move to common
  // signOn: signOnReducer,
  // backend,
  // confirmer,

  // Config
  reachability,

  // Cache
  // @ts-ignore
  collections: asCache(collectionsReducer, Kind.COLLECTIONS),
  // TODO: Fix type error
  // @ts-ignore
  tracks: asCache(tracksReducer(ssrPageProps), Kind.TRACKS),
  // TODO: Fix type error
  // @ts-ignore
  users: asCache(usersReducer(ssrPageProps), Kind.USERS),

  savedCollections: savedCollectionsReducer,

  // Playback
  queue,
  player,
  playbackPosition,

  // Wallet
  wallet,

  // Cast
  cast,

  // Playlist Library
  playlistLibrary: playlistLibraryReducer,
  playlistUpdates: playlistUpdatesReducer,

  notifications: notificationsReducer,

  // UI
  ui: combineReducers({
    averageColor: averageColorReducer,
    addToCollection: addToCollectionReducer,
    buyAudio: buyAudioReducer,

    relatedArtists: relatedArtistsReducer,
    changePassword: changePasswordReducer,
    collectibleDetails: collectibleDetailsReducer,
    deletePlaylistConfirmationModal: deletePlaylistConfirmationReducer,
    duplicateAddConfirmationModal: duplicateAddConfirmationReducer,
    publishPlaylistConfirmationModal: publishPlaylistConfirmationReducer,
    mobileOverflowModal: mobileOverflowModalReducer,
    modals: modalsReducer,
    musicConfetti: musicConfettiReducer,
    nowPlaying: nowPlayingReducer,
    reactions: reactionsReducer,
    remixSettings: remixSettingsReducer,
    shareSoundToTikTokModal: shareSoundToTikTokModalReducer,
    shareModal: shareModalReducer,
    stripeModal: stripeModalReducer,
    coinflowModal: coinflowModalReducer,
    searchUsersModal: searchUsersModalReducer,
    toast: toastReducer,
    transactionDetails: transactionDetailsReducer,
    uploadConfirmationModal: uploadConfirmationReducer,
    publishTrackConfirmationModal: publishTrackConfirmationReducer,
    userList: combineReducers({
      followers: followersUserListReducer,
      following: followingUserListReducer,
      reposts: repostsUserListReducer,
      favorites: favoritesUserListReducer,
      topSupporters: topSupportersUserListReducer,
      supporting: supportingUserListReducer,
      mutuals: mutualsUserListReducer,
      notifications: notificationsUserListReducer,
      relatedArtists: relatedArtistsListReducer
    }),
    theme,
    vipDiscordModal: vipDiscordModalReducer,
    recoveryEmail: recoveryEmailReducer
  }),

  // Pages
  pages: combineReducers({
    ai,
    audioRewards: audioRewardsSlice.reducer,
    audioTransactions: audioTransactionsSlice.reducer,
    chat: chatReducer,
    collection,
    deactivateAccount: deactivateAccountReducer,
    feed,
    explore: explorePageReducer,
    exploreCollections: exploreCollectionsReducer,
    historyPage: historyPageReducer,
    profile: profileReducer,
    smartCollection,
    savedPage: isServerSide
      ? savePageReducer
      : persistedSavePageReducer(storage),
    searchResults,
    tokenDashboard: tokenDashboardSlice.reducer,
    track: track(ssrPageProps),
    trending: trending(history),
    trendingPlaylists,
    trendingUnderground,
    settings,
    remixes,
    premiumTracks
  }),

  // Solana
  solana: solanaReducer,

  stemsUpload,

  // Tipping
  tipping: tippingReducer,

  // Gated content
  buyUSDC: buyUSDCReducer,
  buyCrypto: buyCryptoReducer,
  gatedContent,
  purchaseContent: purchaseContentReducer,
  withdrawUSDC: withdrawUSDCReducer,

  // Collectibles
  collectibles,

  upload,
  confirmer
})

export type CommonState = {
  account: ReturnType<typeof account>
  // TODO: Migrate to common
  // signOn: ReturnType<typeof signOnReducer>

  // TODO: Migrate to common
  // backend: BackendState

  // Config
  reachability: ReachabilityState

  // TODO: Migrate to common
  // confirmer: ConfirmerState

  // Cache
  collections: CollectionsCacheState
  tracks: TracksCacheState
  users: UsersCacheState

  // TODO: missing types for internally managed api slice state
  api: any
  savedCollections: ReturnType<typeof savedCollectionsReducer>

  // Playback
  queue: ReturnType<typeof queue>
  player: PlayerState
  playbackPosition: PlaybackPositionState

  // Wallet
  wallet: ReturnType<typeof wallet>

  // Cast
  cast: ReturnType<typeof cast>

  // Playlist library
  playlistLibrary: PlaylistLibraryState
  playlistUpdates: PlaylistUpdateState

  notifications: NotificationsState

  ui: {
    averageColor: ReturnType<typeof averageColorReducer>
    buyAudio: ReturnType<typeof buyAudioReducer>
    addToCollection: AddToCollectionState
    changePassword: ChangePasswordState
    collectibleDetails: CollectibleDetailsState
    deletePlaylistConfirmationModal: DeletePlaylistConfirmationModalState
    duplicateAddConfirmationModal: DuplicateAddConfirmationModalState
    publishPlaylistConfirmationModal: PublishPlaylistConfirmationModalState
    mobileOverflowModal: MobileOverflowModalState
    modals: ModalsState
    musicConfetti: MusicConfettiState
    nowPlaying: NowPlayingState
    reactions: ReactionsState
    relatedArtists: RelatedArtistsState
    remixSettings: RemixSettingsState
    shareSoundToTikTokModal: ShareSoundToTikTokModalState
    searchUsersModal: SearchUsersModalState
    shareModal: ShareModalState
    stripeModal: StripeModalState
    toast: ToastState
    transactionDetails: TransactionDetailsState
    uploadConfirmationModal: UploadConfirmationModalState
    publishTrackConfirmationModal: PublishTrackConfirmationModalState
    userList: {
      mutuals: ReturnType<typeof mutualsUserListReducer>
      notifications: ReturnType<typeof notificationsUserListReducer>
      followers: ReturnType<typeof followersUserListReducer>
      following: ReturnType<typeof followingUserListReducer>
      reposts: ReturnType<typeof repostsUserListReducer>
      favorites: ReturnType<typeof favoritesUserListReducer>
      topSupporters: ReturnType<typeof topSupportersUserListReducer>
      supporting: ReturnType<typeof supportingUserListReducer>
      relatedArtists: ReturnType<typeof relatedArtistsListReducer>
    }
    theme: ThemeState
    vipDiscordModal: VipDiscordModalState
    recoveryEmail: RecoveryEmailState
  }

  pages: {
    ai: ReturnType<typeof ai>
    audioRewards: ReturnType<typeof audioRewardsSlice.reducer>
    audioTransactions: ReturnType<typeof audioTransactionsSlice.reducer>
    chat: ReturnType<typeof chatReducer>
    collection: CollectionsPageState
    deactivateAccount: DeactivateAccountState
    feed: FeedPageState
    explore: ReturnType<typeof explorePageReducer>
    exploreCollections: ReturnType<typeof exploreCollectionsReducer>
    smartCollection: ReturnType<typeof smartCollection>
    tokenDashboard: ReturnType<typeof tokenDashboardSlice.reducer>
    historyPage: HistoryPageState
    track: TrackPageState
    profile: ProfilePageState
    savedPage: SavedPageState
    searchResults: SearchPageState
    settings: SettingsPageState
    trending: TrendingPageState
    trendingPlaylists: ReturnType<typeof trendingPlaylists>
    trendingUnderground: ReturnType<typeof trendingUnderground>
    remixes: ReturnType<typeof remixes>
    premiumTracks: ReturnType<typeof premiumTracks>
  }
  solana: ReturnType<typeof solanaReducer>

  stemsUpload: ReturnType<typeof stemsUpload>

  // USDC
  buyUSDC: ReturnType<typeof buyUSDCReducer>
  buyCrypto: ReturnType<typeof buyCryptoReducer>

  // Tipping
  tipping: ReturnType<typeof tippingReducer>

  // Gated content
  purchaseContent: ReturnType<typeof purchaseContentReducer>
  gatedContent: ReturnType<typeof gatedContent>
  withdrawUSDC: ReturnType<typeof withdrawUSDCReducer>

  // Collectibles
  collectibles: ReturnType<typeof collectibles>

  upload: UploadState
  confirmer: ConfirmerState
}
