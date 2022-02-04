import { connectRouter } from 'connected-react-router'
import { History } from 'history'
import { combineReducers } from 'redux'

import { reducers as clientStoreReducers } from 'common/store'
import profile from 'common/store/pages/profile/reducer'
import remoteConfig from 'common/store/remote-config/slice'
import artistRecommendations from 'components/artist-recommendations/store/slice'
import changePassword from 'components/change-password/store/slice'
import embedModal from 'components/embed-modal/store/reducers'
import firstUploadModal from 'components/first-upload-modal/store/slice'
import musicConfetti from 'components/music-confetti/store/slice'
import notification from 'components/notification/store/reducer'
import nowPlaying from 'components/now-playing/store/reducers'
import passwordReset from 'components/password-reset/store/reducer'
import remixSettingsModal from 'components/remix-settings-modal/store/slice'
import searchBar from 'components/search-bar/store/reducer'
import serviceSelection from 'components/service-selection/store/slice'
import unfollowConfirmation from 'components/unfollow-confirmation-modal/store/reducers'
import dashboard from 'pages/artist-dashboard-page/store/reducer'
import collection from 'pages/collection-page/store/reducer'
import deactivateAccount from 'pages/deactivate-account-page/store/slice'
import deleted from 'pages/deleted-page/store/slice'
import favorites from 'pages/favorites-page/store/reducers'
import followers from 'pages/followers-page/store/reducers'
import following from 'pages/following-page/store/reducers'
import history from 'pages/history-page/store/reducer'
import notificationUsers from 'pages/notification-users-page/store/reducers'
import remixes from 'pages/remixes-page/store/slice'
import reposts from 'pages/reposts-page/store/reducers'
import saved from 'pages/saved-page/store/reducer'
import search from 'pages/search-page/store/reducer'
import settings from 'pages/settings-page/store/reducer'
import signOn from 'pages/sign-on/store/reducer'
import smartCollection from 'pages/smart-collection/store/slice'
import trending from 'pages/trending-page/store/reducer'
import trendingPlaylists from 'pages/trending-playlists/store/slice'
import trendingUnderground from 'pages/trending-underground/store/slice'
import upload from 'pages/upload-page/store/reducer'
import visualizer from 'pages/visualizer/store/slice'
import appCTAModal from 'store/application/ui/app-cta-modal/slice'
import cookieBanner from 'store/application/ui/cookieBanner/reducer'
import editPlaylistModal from 'store/application/ui/editPlaylistModal/slice'
import editTrackModal from 'store/application/ui/editTrackModal/reducer'
import mobileKeyboard from 'store/application/ui/mobileKeyboard/reducer'
import scrollLock from 'store/application/ui/scrollLock/reducer'
import setAsArtistPickConfirmation from 'store/application/ui/setAsArtistPickConfirmation/reducer'
import theme from 'store/application/ui/theme/reducer'
import userListModal from 'store/application/ui/userListModal/slice'
import audioManager from 'store/audio-manager/slice'
import backend from 'store/backend/reducer'
import confirmer from 'store/confirmer/reducer'
import dragndrop from 'store/dragndrop/reducer'
import player from 'store/player/slice'
import playlistLibrary from 'store/playlist-library/slice'
import queue from 'store/queue/slice'
import reachability from 'store/reachability/reducer'

const createRootReducer = (routeHistory: History) =>
  combineReducers({
    // Client store
    ...clientStoreReducers,

    // Router
    router: connectRouter(routeHistory),

    // Config
    backend,
    confirmer,
    reachability,

    // Account
    passwordReset,
    playlistLibrary,

    // UI Functions
    dragndrop,

    // Pages
    upload,
    profile,
    dashboard,
    signOn,
    trending,
    history,
    saved,
    searchBar,
    search,
    collection,
    notification,
    serviceSelection,

    // Playback
    queue,
    player,

    // Remote config/flags
    remoteConfig,

    // Wallet
    audioManager,

    application: combineReducers({
      ui: combineReducers({
        appCTAModal,
        artistRecommendations,
        changePassword,
        cookieBanner,
        deactivateAccount,
        editPlaylistModal,
        editTrackModal,
        embedModal,
        firstUploadModal,
        mobileKeyboard,
        musicConfetti,
        remixSettingsModal,
        scrollLock,
        setAsArtistPickConfirmation,
        theme,
        userListModal,
        visualizer
      }),
      pages: combineReducers({
        deleted,
        favorites,
        followers,
        following,
        notificationUsers,
        nowPlaying,
        remixes,
        reposts,
        settings,
        smartCollection,
        trendingPlaylists,
        trendingUnderground,
        unfollowConfirmation
      })
    })
  })

export default createRootReducer
