import { connectRouter } from 'connected-react-router'
import { combineReducers } from 'redux'

import { reducers as clientStoreReducers } from 'common/store'
import dashboard from 'containers/artist-dashboard-page/store/reducer'
import artistRecommendations from 'containers/artist-recommendations/store/slice'
import changePassword from 'containers/change-password/store/slice'
import collection from 'containers/collection-page/store/reducer'
import deactivateAccount from 'containers/deactivate-account-page/store/slice'
import deleted from 'containers/deleted-page/store/slice'
import embedModal from 'containers/embed-modal/store/reducers'
import exploreCollections from 'containers/explore-page/store/collections/slice'
import explore from 'containers/explore-page/store/reducer'
import favorites from 'containers/favorites-page/store/reducers'
import feed from 'containers/feed-page/store/reducer'
import firstUploadModal from 'containers/first-upload-modal/store/slice'
import followers from 'containers/followers-page/store/reducers'
import following from 'containers/following-page/store/reducers'
import history from 'containers/history-page/store/reducer'
import musicConfetti from 'containers/music-confetti/store/slice'
import notificationUsers from 'containers/notification-users-page/store/reducers'
import notification from 'containers/notification/store/reducer'
import nowPlaying from 'containers/now-playing/store/reducers'
import passwordReset from 'containers/password-reset/store/reducer'
import profile from 'containers/profile-page/store/reducer'
import remixSettingsModal from 'containers/remix-settings-modal/store/slice'
import remixes from 'containers/remixes-page/store/slice'
import remoteConfig from 'containers/remote-config/slice'
import reposts from 'containers/reposts-page/store/reducers'
import saved from 'containers/saved-page/store/reducer'
import searchBar from 'containers/search-bar/store/reducer'
import search from 'containers/search-page/store/reducer'
import serviceSelection from 'containers/service-selection/store/slice'
import settings from 'containers/settings-page/store/reducer'
import signOn from 'containers/sign-on/store/reducer'
import smartCollection from 'containers/smart-collection/store/slice'
import track from 'containers/track-page/store/reducer'
import trending from 'containers/trending-page/store/reducer'
import trendingPlaylists from 'containers/trending-playlists/store/slice'
import trendingUnderground from 'containers/trending-underground/store/slice'
import unfollowConfirmation from 'containers/unfollow-confirmation-modal/store/reducers'
import upload from 'containers/upload-page/store/reducer'
import visualizer from 'containers/visualizer/store/slice'
import appCTAModal from 'store/application/ui/app-cta-modal/slice'
import averageColor from 'store/application/ui/average-color/slice'
import cookieBanner from 'store/application/ui/cookieBanner/reducer'
import editPlaylistModal from 'store/application/ui/editPlaylistModal/slice'
import editTrackModal from 'store/application/ui/editTrackModal/reducer'
import mobileKeyboard from 'store/application/ui/mobileKeyboard/reducer'
import scrollLock from 'store/application/ui/scrollLock/reducer'
import setAsArtistPickConfirmation from 'store/application/ui/setAsArtistPickConfirmation/reducer'
import stemsUpload from 'store/application/ui/stemsUpload/slice'
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
import tokenDashboard from 'store/token-dashboard/slice'
import wallet from 'store/wallet/slice'

const createRootReducer = routeHistory =>
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
    feed,
    trending,
    history,
    saved,
    searchBar,
    search,
    collection,
    track,
    notification,
    serviceSelection,

    // Playback
    queue,
    player,

    // Remote config/flags
    remoteConfig,

    // Wallet
    wallet,
    audioManager,

    application: combineReducers({
      ui: combineReducers({
        appCTAModal,
        artistRecommendations,
        averageColor,
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
        stemsUpload,
        theme,
        userListModal,
        visualizer
      }),
      pages: combineReducers({
        deleted,
        explore,
        exploreCollections,
        favorites,
        followers,
        following,
        notificationUsers,
        nowPlaying,
        remixes,
        reposts,
        settings,
        smartCollection,
        tokenDashboard,
        trendingPlaylists,
        trendingUnderground,
        unfollowConfirmation
      })
    })
  })

export default createRootReducer
