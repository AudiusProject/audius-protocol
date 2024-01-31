import {
  averageColorReducer,
  remixesPageReducer as RemixesPageReducer,
  queueReducer as QueueReducer,
  remoteConfigReducer as RemoteConfigReducer,
  stemsUploadReducer as StemsUploadReducer,
  ChangePasswordState,
  CollectionsPageState,
  HistoryPageState,
  SmartCollectionState,
  ReachabilityState,
  CommonState,
  FavoritesPageState,
  FollowersPageState,
  FollowingPageState,
  NotificationUsersPageState,
  RepostsPageState
} from '@audius/common/store'
import { RouterState } from 'connected-react-router'

import SignOnPageState from 'common/store/pages/signon/types'
import { SearchAiBarState } from 'common/store/search-ai-bar/types'
import { SearchBarState } from 'common/store/search-bar/types'
import { EmbedModalState } from 'components/embed-modal/store/types'
import { FirstUploadModalState } from 'components/first-upload-modal/store/slice'
import { PasswordResetState } from 'components/password-reset/store/types'
import { UnfollowConfirmationModalState } from 'components/unfollow-confirmation-modal/store/types'
import ArtistDashboardState from 'pages/dashboard-page/store/types'
import DeletedPageReducer from 'pages/deleted-page/store/slice'
import VisualizerReducer from 'pages/visualizer/store/slice'
import AppCTAModalReducer from 'store/application/ui/app-cta-modal/slice'
import { ErrorState } from 'store/errors/reducers'

import { BackendState } from '../common/store/backend/types'

import { CookieBannerState } from './application/ui/cookieBanner/types'
import { EditFolderModalState } from './application/ui/editFolderModal/slice'
import { NotificationsUIState } from './application/ui/notifications/notificationsUISlice'
import { ScrollLockState } from './application/ui/scrollLock/types'
import { SetAsArtistPickConfirmationState } from './application/ui/setAsArtistPickConfirmation/types'
import { UserListModalState } from './application/ui/userListModal/types'
import { DragnDropState } from './dragndrop/slice'
const averageColor = averageColorReducer

export type AppState = CommonState & {
  // These belong in CommonState but are here until we move them to the @audius/common package:
  backend: BackendState

  searchBar: SearchBarState
  searchAiBar: SearchAiBarState
  signOn: SignOnPageState

  // Config
  reachability: ReachabilityState
  // Account
  passwordReset: PasswordResetState

  // UI
  dragndrop: DragnDropState

  // Global
  application: {
    ui: {
      appCTAModal: ReturnType<typeof AppCTAModalReducer>
      averageColor: ReturnType<typeof averageColor>
      changePassword: ChangePasswordState
      cookieBanner: CookieBannerState
      editFolderModal: EditFolderModalState
      embedModal: EmbedModalState
      firstUploadModal: FirstUploadModalState
      scrollLock: ScrollLockState
      setAsArtistPickConfirmation: SetAsArtistPickConfirmationState
      stemsUpload: ReturnType<typeof StemsUploadReducer>
      userListModal: UserListModalState
      visualizer: ReturnType<typeof VisualizerReducer>
      notifications: NotificationsUIState
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
  dashboard: ArtistDashboardState
  history: HistoryPageState
  collection: CollectionsPageState

  // Playback
  queue: ReturnType<typeof QueueReducer>

  // Misc
  router: RouterState

  // Remote Config + Flags
  remoteConfig: ReturnType<typeof RemoteConfigReducer>

  // Error Page
  error: ErrorState
}
