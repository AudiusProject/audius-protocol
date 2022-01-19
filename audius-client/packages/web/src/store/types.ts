import { RouterState } from 'connected-react-router'

import { CommonState } from 'common/store'
import RemoteConfigReducer from 'common/store/remote-config/slice'
import { CreatePlaylistModalState } from 'common/store/ui/createPlaylistModal/types'
import ArtistRecommendationsReducer from 'components/artist-recommendations/store/slice'
import { ChangePasswordState } from 'components/change-password/store/slice'
import { EmbedModalState } from 'components/embed-modal/store/types'
import { FirstUploadModalState } from 'components/first-upload-modal/store/slice'
import MusicConfetti from 'components/music-confetti/store/slice'
import NotificationState from 'components/notification/store/types'
import { NowPlayingState } from 'components/now-playing/store/types'
import { PasswordResetState } from 'components/password-reset/store/types'
import RemixSettingsModalReducer from 'components/remix-settings-modal/store/slice'
import SearchBarState from 'components/search-bar/store/types'
import ServiceSelectionReducer from 'components/service-selection/store/slice'
import { UnfollowConfirmationModalState } from 'components/unfollow-confirmation-modal/store/types'
import ArtistDashboardState from 'pages/artist-dashboard-page/store/types'
import { CollectionsPageState } from 'pages/collection-page/store/types'
import { DeactivateAccountState } from 'pages/deactivate-account-page/store/slice'
import DeletedPageReducer from 'pages/deleted-page/store/slice'
import { CollectionsState as ExploreCollectionsState } from 'pages/explore-page/store/collections/slice'
import ExplorePageState from 'pages/explore-page/store/types'
import { FavoritesPageState } from 'pages/favorites-page/store/types'
import FeedPageState from 'pages/feed-page/store/types'
import { FollowersPageState } from 'pages/followers-page/store/types'
import { FollowingPageState } from 'pages/following-page/store/types'
import HistoryPageState from 'pages/history-page/store/types'
import { NotificationUsersPageState } from 'pages/notification-users-page/store/types'
import { ProfilePageState } from 'pages/profile-page/store/types'
import RemixesPageReducer from 'pages/remixes-page/store/slice'
import { RepostsPageState } from 'pages/reposts-page/store/types'
import SavesPageState from 'pages/saved-page/store/types'
import { SearchPageState } from 'pages/search-page/store/types'
import SettingsPageState from 'pages/settings-page/store/types'
import SignOnPageState from 'pages/sign-on/store/types'
import { SmartCollectionState } from 'pages/smart-collection/store/slice'
import TrendingPageState from 'pages/trending-page/store/types'
import trendingPlaylistsReducer from 'pages/trending-playlists/store/slice'
import trendingUndergroundReducer from 'pages/trending-underground/store/slice'
import { UploadPageState } from 'pages/upload-page/store/types'
import VisualizerReducer from 'pages/visualizer/store/slice'
import AppCTAModalReducer from 'store/application/ui/app-cta-modal/slice'
import averageColor from 'store/application/ui/average-color/slice'
import StemsUploadReducer from 'store/application/ui/stemsUpload/slice'
import { AudioManagerState } from 'store/audio-manager/slice'
import PlayerReducer from 'store/player/slice'
import PlaylistLibraryReducer from 'store/playlist-library/slice'
import QueueReducer from 'store/queue/slice'

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
  notification: NotificationState

  // Playback
  queue: ReturnType<typeof QueueReducer>
  player: ReturnType<typeof PlayerReducer>

  // Misc
  router: RouterState

  // Remote Config + Flags
  remoteConfig: ReturnType<typeof RemoteConfigReducer>
}
