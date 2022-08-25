import {
  profilePageReducer as profile,
  queueReducer as queue,
  remoteConfigReducer as remoteConfig,
  reducers as clientStoreReducers
} from '@audius/common'
import { connectRouter } from 'connected-react-router'
import { History } from 'history'
import { combineReducers } from 'redux'

import backend from 'common/store/backend/reducer'
import confirmer from 'common/store/confirmer/reducer'
import signOnReducer from 'common/store/pages/signon/reducer'
import playlistLibrary from 'common/store/playlist-library/slice'
import searchBar from 'common/store/search-bar/reducer'
import serviceSelection from 'common/store/service-selection/slice'
import embedModal from 'components/embed-modal/store/reducers'
import firstUploadModal from 'components/first-upload-modal/store/slice'
import musicConfetti from 'components/music-confetti/store/slice'
import passwordReset from 'components/password-reset/store/reducer'
import remixSettingsModal from 'components/remix-settings-modal/store/slice'
import unfollowConfirmation from 'components/unfollow-confirmation-modal/store/reducers'
import dashboard from 'pages/artist-dashboard-page/store/reducer'
import deactivateAccount from 'pages/deactivate-account-page/store/slice'
import deleted from 'pages/deleted-page/store/slice'
import upload from 'pages/upload-page/store/reducer'
import visualizer from 'pages/visualizer/store/slice'
import appCTAModal from 'store/application/ui/app-cta-modal/slice'
import cookieBanner from 'store/application/ui/cookieBanner/reducer'
import editFolderModal from 'store/application/ui/editFolderModal/slice'
import editPlaylistModal from 'store/application/ui/editPlaylistModal/slice'
import editTrackModal from 'store/application/ui/editTrackModal/reducer'
import mobileKeyboard from 'store/application/ui/mobileKeyboard/reducer'
import scrollLock from 'store/application/ui/scrollLock/reducer'
import setAsArtistPickConfirmation from 'store/application/ui/setAsArtistPickConfirmation/reducer'
import userListModal from 'store/application/ui/userListModal/slice'
import dragndrop from 'store/dragndrop/reducer'

export const commonStoreReducers = clientStoreReducers()

const createRootReducer = (routeHistory: History) =>
  combineReducers({
    // Common store
    ...commonStoreReducers,
    // These also belong in common store reducers but are here until we move them to the @audius/common package.
    backend,
    signOn: signOnReducer,
    confirmer,
    searchBar,

    // (End common store)

    // Router
    router: connectRouter(routeHistory),

    // Account
    passwordReset,
    playlistLibrary,

    // UI Functions
    dragndrop,

    // Pages
    upload,
    profile,
    dashboard,
    serviceSelection,

    // Playback
    queue,

    // Remote config/flags
    remoteConfig,
    application: combineReducers({
      ui: combineReducers({
        appCTAModal,
        cookieBanner,
        deactivateAccount,
        editFolderModal,
        editPlaylistModal,
        editTrackModal,
        embedModal,
        firstUploadModal,
        mobileKeyboard,
        musicConfetti,
        remixSettingsModal,
        scrollLock,
        setAsArtistPickConfirmation,
        userListModal,
        visualizer
      }),
      pages: combineReducers({
        deleted,
        unfollowConfirmation
      })
    })
  })

export default createRootReducer
