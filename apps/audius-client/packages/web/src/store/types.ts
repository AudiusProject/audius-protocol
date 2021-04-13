import ArtistDashboardState from 'containers/artist-dashboard-page/store/types'
import CollectionsPageState from 'containers/collection-page/store/types'
import FeedPageState from 'containers/feed-page/store/types'
import TrendingPageState from 'containers/trending-page/store/types'
import ExplorePageState from 'containers/explore-page/store/types'
import HistoryPageState from 'containers/history-page/store/types'
import NotificationState from 'containers/notification/store/types'
import SavesPageState from 'containers/saved-page/store/types'
import SearchBarState from 'containers/search-bar/store/types'
import SearchPageState from 'containers/search-page/store/types'
import SignOnPageState from 'containers/sign-on/store/types'
import TrackPageState from 'containers/track-page/store/types'
import SettingsPageState from 'containers/settings-page/store/types'
import UserCacheState from 'store/cache/users/types'

import { ProfilePageState } from 'containers/profile-page/store/types'
import { UploadPageState } from 'containers/upload-page/store/types'
import VisualizerReducer from 'containers/visualizer/store/slice'
import { ThemeState } from './application/ui/theme/types'
import { CreatePlaylistModalState } from './application/ui/createPlaylistModal/types'
import { EditPlaylistModalState } from './application/ui/editPlaylistModal/slice'
import { CookieBannerState } from './application/ui/cookieBanner/types'
import { ScrollLockState } from './application/ui/scrollLock/types'
import { SetAsArtistPickConfirmationState } from './application/ui/setAsArtistPickConfirmation/types'
import { BackendState } from './backend/types'
import { ConfirmerState } from './confirmer/types'
import { DragNDropState } from './dragndrop/types'
import PlayerReducer from 'store/player/slice'
import QueueReducer from 'store/queue/slice'
import { PasswordResetState } from 'containers/password-reset/store/types'
import MusicConfetti from 'containers/music-confetti/store/slice'
import MobileUploadDrawer from 'containers/mobile-upload-drawer/store/slice'
import EnablePushNotificationsDrawer from 'containers/enable-push-notifications-drawer/store/slice'
import AccountReducer from 'store/account/reducer'
import tokenDashboard from 'store/token-dashboard/slice'

import Collection from 'models/Collection'
import Cache from 'models/common/Cache'
import Track from 'models/Track'

import { RouterState } from 'connected-react-router'
import EditTrackModalState from './application/ui/editTrackModal/types'
import { BrowserPushPermissionConfirmationModalState } from './application/ui/browserPushPermissionConfirmation/types'
import { MobileOverflowModalState } from './application/ui/mobileOverflowModal/types'
import { RepostsPageState } from 'containers/reposts-page/store/types'
import { FavoritesPageState } from 'containers/favorites-page/store/types'
import { FollowingPageState } from 'containers/following-page/store/types'
import { NotificationUsersPageState } from 'containers/notification-users-page/store/types'
import { FollowersPageState } from 'containers/followers-page/store/types'
import { UnfollowConfirmationModalState } from 'containers/unfollow-confirmation-modal/store/types'
import { DeletePlaylistConfirmationModalState } from 'containers/delete-playlist-confirmation-modal/store/types'
import { EmbedModalState } from 'containers/embed-modal/store/types'
import { AddToPlaylistState } from 'containers/add-to-playlist/store/reducers'
import { NowPlayingState } from 'containers/now-playing/store/types'
import { ReachabilityState } from './reachability/types'
import { MobileKeyboardState } from './application/ui/mobileKeyboard/types'
import { UserListModalState } from './application/ui/userListModal/types'
import { FirstUploadModalState } from 'containers/first-upload-modal/store/slice'
import RemixSettingsModalReducer from 'containers/remix-settings-modal/store/slice'
import { SmartCollectionState } from 'containers/smart-collection/store/slice'
import { CollectionsState as ExploreCollectionsState } from 'containers/explore-page/store/collections/slice'
import RemixesPageReducer from 'containers/remixes-page/store/slice'
import DeletedPageReducer from 'containers/deleted-page/store/slice'
import RemoteConfigReducer from 'containers/remote-config/slice'
import StemsUploadReducer from 'store/application/ui/stemsUpload/slice'
import AppCTAModalReducer from 'store/application/ui/app-cta-modal/slice'
import ServiceSelectionReducer from 'containers/service-selection/store/slice'
import averageColor from 'store/application/ui/average-color/slice'
import modals from 'store/application/ui/modals/slice'
import trendingPlaylistsReducer from 'containers/trending-playlists/store/slice'
import rewardsUI from 'containers/audio-rewards-page/store/slice'

import wallet from 'store/wallet/slice'

export enum Kind {
  TRACKS = 'TRACKS',
  COLLECTIONS = 'COLLECTIONS',
  USERS = 'USERS'
}

export enum Status {
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type AppState = {
  // Config
  backend: BackendState
  account: ReturnType<typeof AccountReducer>
  confirmer: ConfirmerState
  passwordReset: PasswordResetState
  reachability: ReachabilityState

  // UI
  dragndrop: DragNDropState
  serviceSelection: ReturnType<typeof ServiceSelectionReducer>

  // Wallet
  wallet: ReturnType<typeof wallet>

  // Global
  application: {
    ui: {
      createPlaylistModal: CreatePlaylistModalState
      editPlaylistModal: EditPlaylistModalState
      editTrackModal: EditTrackModalState
      theme: ThemeState
      scrollLock: ScrollLockState
      cookieBanner: CookieBannerState
      setAsArtistPickConfirmation: SetAsArtistPickConfirmationState
      embedModal: EmbedModalState
      mobileOverflowModal: MobileOverflowModalState
      mobileKeyboard: MobileKeyboardState
      userListModal: UserListModalState
      firstUploadModal: FirstUploadModalState
      browserPushPermissionConfirmation: BrowserPushPermissionConfirmationModalState
      remixSettingsModal: ReturnType<typeof RemixSettingsModalReducer>
      visualizer: ReturnType<typeof VisualizerReducer>
      stemsUpload: ReturnType<typeof StemsUploadReducer>
      appCTAModal: ReturnType<typeof AppCTAModalReducer>
      musicConfetti: ReturnType<typeof MusicConfetti>
      mobileUploadDrawer: ReturnType<typeof MobileUploadDrawer>
      enablePushNotificationsDrawer: ReturnType<
        typeof EnablePushNotificationsDrawer
      >
      averageColor: ReturnType<typeof averageColor>
      modals: ReturnType<typeof modals>
      rewardsUI: ReturnType<typeof rewardsUI>
    }
    pages: {
      explore: ExplorePageState
      settings: SettingsPageState
      reposts: RepostsPageState
      favorites: FavoritesPageState
      followers: FollowersPageState
      following: FollowingPageState
      notificationUsers: NotificationUsersPageState
      unfollowConfirmation: UnfollowConfirmationModalState
      deletePlaylistConfirmation: DeletePlaylistConfirmationModalState
      addToPlaylist: AddToPlaylistState
      nowPlaying: NowPlayingState
      smartCollection: SmartCollectionState
      exploreCollections: ExploreCollectionsState
      remixes: ReturnType<typeof RemixesPageReducer>
      deleted: ReturnType<typeof DeletedPageReducer>
      tokenDashboard: ReturnType<typeof tokenDashboard>
      trendingPlaylists: ReturnType<typeof trendingPlaylistsReducer>
    }
  }

  // Pages
  upload: UploadPageState
  profile: ProfilePageState
  dashboard: ArtistDashboardState
  signOn: SignOnPageState
  feed: FeedPageState
  trending: TrendingPageState
  history: HistoryPageState
  saved: SavesPageState
  searchBar: SearchBarState
  search: SearchPageState
  collection: CollectionsPageState
  track: TrackPageState
  notification: NotificationState

  // Cache
  tracks: Cache<Track>
  collections: Cache<Collection>
  users: UserCacheState

  // Playback
  queue: ReturnType<typeof QueueReducer>
  player: ReturnType<typeof PlayerReducer>

  // Misc
  router: RouterState

  // Remote Config + Flags
  remoteConfig: ReturnType<typeof RemoteConfigReducer>
}
