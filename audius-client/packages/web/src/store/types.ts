import {
  averageColorReducer,
  ChangePasswordState,
  NotificationState,
  SmartCollectionState,
  remixesPageReducer as RemixesPageReducer,
  HistoryPageState,
  CollectionsPageState,
  queueReducer as QueueReducer,
  ReachabilityState,
  remoteConfigReducer as RemoteConfigReducer,
  stemsUploadReducer as StemsUploadReducer,
  CreatePlaylistModalState,
  RepostsPageState,
  NotificationUsersPageState,
  FollowingPageState,
  FollowersPageState,
  FavoritesPageState,
  CommonState
} from '@audius/common'
import { RouterState } from 'connected-react-router'

import signOnReducer from 'common/store/pages/signon/reducer'
import PlaylistLibraryReducer from 'common/store/playlist-library/slice'
import SearchBarState from 'common/store/search-bar/types'
import ServiceSelectionReducer from 'common/store/service-selection/slice'
import { EmbedModalState } from 'components/embed-modal/store/types'
import { FirstUploadModalState } from 'components/first-upload-modal/store/slice'
import MusicConfetti from 'components/music-confetti/store/slice'
import { PasswordResetState } from 'components/password-reset/store/types'
import RemixSettingsModalReducer from 'components/remix-settings-modal/store/slice'
import { UnfollowConfirmationModalState } from 'components/unfollow-confirmation-modal/store/types'
import ArtistDashboardState from 'pages/artist-dashboard-page/store/types'
import DeletedPageReducer from 'pages/deleted-page/store/slice'
import { UploadPageState } from 'pages/upload-page/store/types'
import VisualizerReducer from 'pages/visualizer/store/slice'
import AppCTAModalReducer from 'store/application/ui/app-cta-modal/slice'

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
const averageColor = averageColorReducer

export type AppState = CommonState & {
  // These belong in CommonState but are here until we move them to the @audius/common package:
  backend: BackendState
  confirmer: ConfirmerState
  searchBar: SearchBarState
  signOn: ReturnType<typeof signOnReducer>

  // Config
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
  history: HistoryPageState
  collection: CollectionsPageState
  notification: NotificationState

  // Playback
  queue: ReturnType<typeof QueueReducer>

  // Misc
  router: RouterState

  // Remote Config + Flags
  remoteConfig: ReturnType<typeof RemoteConfigReducer>
}
