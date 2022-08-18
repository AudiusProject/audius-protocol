import { RouterState } from 'connected-react-router'

import { CommonState } from 'common/store'
import averageColor from 'common/store/average-color/slice'
import { ChangePasswordState } from 'common/store/change-password/slice'
import NotificationState from 'common/store/notifications/types'
import { CollectionsPageState } from 'common/store/pages/collection/types'
import HistoryPageState from 'common/store/pages/history-page/types'
import RemixesPageReducer from 'common/store/pages/remixes/slice'
import SignOnPageState from 'common/store/pages/signon/types'
import { SmartCollectionState } from 'common/store/pages/smart-collection/slice'
import QueueReducer from 'common/store/queue/slice'
import { ReachabilityState } from 'common/store/reachability/types'
import RemoteConfigReducer from 'common/store/remote-config/slice'
import ServiceSelectionReducer from 'common/store/service-selection/slice'
import StemsUploadReducer from 'common/store/stems-upload/slice'
import { CreatePlaylistModalState } from 'common/store/ui/createPlaylistModal/types'
import { FavoritesPageState } from 'common/store/user-list/favorites/types'
import { FollowersPageState } from 'common/store/user-list/followers/types'
import { FollowingPageState } from 'common/store/user-list/following/types'
import { NotificationUsersPageState } from 'common/store/user-list/notifications/types'
import { RepostsPageState } from 'common/store/user-list/reposts/types'
import { EmbedModalState } from 'components/embed-modal/store/types'
import { FirstUploadModalState } from 'components/first-upload-modal/store/slice'
import MusicConfetti from 'components/music-confetti/store/slice'
import { PasswordResetState } from 'components/password-reset/store/types'
import RemixSettingsModalReducer from 'components/remix-settings-modal/store/slice'
import SearchBarState from 'components/search-bar/store/types'
import { UnfollowConfirmationModalState } from 'components/unfollow-confirmation-modal/store/types'
import ArtistDashboardState from 'pages/artist-dashboard-page/store/types'
import { DeactivateAccountState } from 'pages/deactivate-account-page/store/slice'
import DeletedPageReducer from 'pages/deleted-page/store/slice'
import { UploadPageState } from 'pages/upload-page/store/types'
import VisualizerReducer from 'pages/visualizer/store/slice'
import AppCTAModalReducer from 'store/application/ui/app-cta-modal/slice'
import PlayerReducer from 'store/player/slice'
import PlaylistLibraryReducer from 'store/playlist-library/slice'

import { BackendState } from '../common/store/backend/types'
import { ConfirmerState } from '../common/store/confirmer/types'

import { CookieBannerState } from './application/ui/cookieBanner/types'
import { EditFolderModalState } from './application/ui/editFolderModal/slice'
import { EditPlaylistModalState } from './application/ui/editPlaylistModal/slice'
import EditTrackModalState from './application/ui/editTrackModal/types'
import { MobileKeyboardState } from './application/ui/mobileKeyboard/types'
import { ScrollLockState } from './application/ui/scrollLock/types'
import { SetAsArtistPickConfirmationState } from './application/ui/setAsArtistPickConfirmation/types'
import { UserListModalState } from './application/ui/userListModal/types'
import { DragNDropState } from './dragndrop/types'

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

  // Global
  application: {
    ui: {
      appCTAModal: ReturnType<typeof AppCTAModalReducer>
      averageColor: ReturnType<typeof averageColor>
      changePassword: ChangePasswordState
      cookieBanner: CookieBannerState
      createPlaylistModal: CreatePlaylistModalState
      editPlaylistModal: EditPlaylistModalState
      editFolderModal: EditFolderModalState
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
      userListModal: UserListModalState
      visualizer: ReturnType<typeof VisualizerReducer>
    }
    pages: {
      reposts: RepostsPageState
      favorites: FavoritesPageState
      followers: FollowersPageState
      following: FollowingPageState
      notificationUsers: NotificationUsersPageState
      unfollowConfirmation: UnfollowConfirmationModalState
      smartCollection: SmartCollectionState
      remixes: ReturnType<typeof RemixesPageReducer>
      deleted: ReturnType<typeof DeletedPageReducer>
    }
  }

  // Pages
  upload: UploadPageState
  dashboard: ArtistDashboardState
  signOn: SignOnPageState
  history: HistoryPageState
  searchBar: SearchBarState
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
