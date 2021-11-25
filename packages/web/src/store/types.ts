import { RouterState } from 'connected-react-router'

import { CommonState } from 'common/store'
import ArtistDashboardState from 'containers/artist-dashboard-page/store/types'
import ArtistRecommendationsReducer from 'containers/artist-recommendations/store/slice'
import { ChangePasswordState } from 'containers/change-password/store/slice'
import { CollectionsPageState } from 'containers/collection-page/store/types'
import { DeactivateAccountState } from 'containers/deactivate-account-page/store/slice'
import DeletedPageReducer from 'containers/deleted-page/store/slice'
import { EmbedModalState } from 'containers/embed-modal/store/types'
import { CollectionsState as ExploreCollectionsState } from 'containers/explore-page/store/collections/slice'
import ExplorePageState from 'containers/explore-page/store/types'
import { FavoritesPageState } from 'containers/favorites-page/store/types'
import FeedPageState from 'containers/feed-page/store/types'
import { FirstUploadModalState } from 'containers/first-upload-modal/store/slice'
import { FollowersPageState } from 'containers/followers-page/store/types'
import { FollowingPageState } from 'containers/following-page/store/types'
import HistoryPageState from 'containers/history-page/store/types'
import MusicConfetti from 'containers/music-confetti/store/slice'
import { NotificationUsersPageState } from 'containers/notification-users-page/store/types'
import NotificationState from 'containers/notification/store/types'
import { NowPlayingState } from 'containers/now-playing/store/types'
import { PasswordResetState } from 'containers/password-reset/store/types'
import { ProfilePageState } from 'containers/profile-page/store/types'
import RemixSettingsModalReducer from 'containers/remix-settings-modal/store/slice'
import RemixesPageReducer from 'containers/remixes-page/store/slice'
import RemoteConfigReducer from 'containers/remote-config/slice'
import { RepostsPageState } from 'containers/reposts-page/store/types'
import SavesPageState from 'containers/saved-page/store/types'
import SearchBarState from 'containers/search-bar/store/types'
import { SearchPageState } from 'containers/search-page/store/types'
import ServiceSelectionReducer from 'containers/service-selection/store/slice'
import SettingsPageState from 'containers/settings-page/store/types'
import SignOnPageState from 'containers/sign-on/store/types'
import { SmartCollectionState } from 'containers/smart-collection/store/slice'
import TrackPageState from 'containers/track-page/store/types'
import TrendingPageState from 'containers/trending-page/store/types'
import trendingPlaylistsReducer from 'containers/trending-playlists/store/slice'
import trendingUndergroundReducer from 'containers/trending-underground/store/slice'
import { UnfollowConfirmationModalState } from 'containers/unfollow-confirmation-modal/store/types'
import { UploadPageState } from 'containers/upload-page/store/types'
import VisualizerReducer from 'containers/visualizer/store/slice'
import AppCTAModalReducer from 'store/application/ui/app-cta-modal/slice'
import averageColor from 'store/application/ui/average-color/slice'
import StemsUploadReducer from 'store/application/ui/stemsUpload/slice'
import { AudioManagerState } from 'store/audio-manager/slice'
import PlayerReducer from 'store/player/slice'
import PlaylistLibraryReducer from 'store/playlist-library/slice'
import QueueReducer from 'store/queue/slice'
import tokenDashboard from 'store/token-dashboard/slice'
import wallet from 'store/wallet/slice'

import { CreatePlaylistModalState } from '../common/store/ui/createPlaylistModal/types'

import { CookieBannerState } from './application/ui/cookieBanner/types'
import { EditPlaylistModalState } from './application/ui/editPlaylistModal/slice'
import EditTrackModalState from './application/ui/editTrackModal/types'
import { MobileKeyboardState } from './application/ui/mobileKeyboard/types'
import { ScrollLockState } from './application/ui/scrollLock/types'
import { SetAsArtistPickConfirmationState } from './application/ui/setAsArtistPickConfirmation/types'
import { ThemeState } from './application/ui/theme/types'
import { UserListModalState } from './application/ui/userListModal/types'
import { BackendState } from './backend/types'
import { ConfirmerState } from './confirmer/types'
import { DragNDropState } from './dragndrop/types'
import { ReachabilityState } from './reachability/types'

export type AppState = CommonState & {
  // Config
  backend: BackendState
  confirmer: ConfirmerState
  reachability: ReachabilityState

  // Account
  passwordReset: PasswordResetState
  playlistLibrary: ReturnType<typeof PlaylistLibraryReducer>

  // UI
  dragndrop: DragNDropState
  serviceSelection: ReturnType<typeof ServiceSelectionReducer>

  // Wallet
  wallet: ReturnType<typeof wallet>
  audioManager: AudioManagerState

  // Global
  application: {
    ui: {
      appCTAModal: ReturnType<typeof AppCTAModalReducer>
      artistRecommendations: ReturnType<typeof ArtistRecommendationsReducer>
      averageColor: ReturnType<typeof averageColor>
      changePassword: ChangePasswordState
      cookieBanner: CookieBannerState
      createPlaylistModal: CreatePlaylistModalState
      editPlaylistModal: EditPlaylistModalState
      editTrackModal: EditTrackModalState
      embedModal: EmbedModalState
      deactivateAccount: DeactivateAccountState
      firstUploadModal: FirstUploadModalState
      mobileKeyboard: MobileKeyboardState
      musicConfetti: ReturnType<typeof MusicConfetti>
      remixSettingsModal: ReturnType<typeof RemixSettingsModalReducer>
      scrollLock: ScrollLockState
      setAsArtistPickConfirmation: SetAsArtistPickConfirmationState
      stemsUpload: ReturnType<typeof StemsUploadReducer>
      theme: ThemeState
      userListModal: UserListModalState
      visualizer: ReturnType<typeof VisualizerReducer>
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
      nowPlaying: NowPlayingState
      smartCollection: SmartCollectionState
      exploreCollections: ExploreCollectionsState
      remixes: ReturnType<typeof RemixesPageReducer>
      deleted: ReturnType<typeof DeletedPageReducer>
      tokenDashboard: ReturnType<typeof tokenDashboard>
      trendingPlaylists: ReturnType<typeof trendingPlaylistsReducer>
      trendingUnderground: ReturnType<typeof trendingUndergroundReducer>
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

  // Playback
  queue: ReturnType<typeof QueueReducer>
  player: ReturnType<typeof PlayerReducer>

  // Misc
  router: RouterState

  // Remote Config + Flags
  remoteConfig: ReturnType<typeof RemoteConfigReducer>
}
