import { connectRouter } from 'connected-react-router'
import { combineReducers } from 'redux'

import addToPlaylist from 'containers/add-to-playlist/store/reducers'
import dashboard from 'containers/artist-dashboard-page/store/reducer'
import rewardsPage from 'containers/audio-rewards-page/store/slice'
import collection from 'containers/collection-page/store/reducer'
import deletePlaylistConfirmation from 'containers/delete-playlist-confirmation-modal/store/reducers'
import deleted from 'containers/deleted-page/store/slice'
import embedModal from 'containers/embed-modal/store/reducers'
import enablePushNotificationsDrawer from 'containers/enable-push-notifications-drawer/store/slice'
import exploreCollections from 'containers/explore-page/store/collections/slice'
import explore from 'containers/explore-page/store/reducer'
import favorites from 'containers/favorites-page/store/reducers'
import feed from 'containers/feed-page/store/reducer'
import firstUploadModal from 'containers/first-upload-modal/store/slice'
import followers from 'containers/followers-page/store/reducers'
import following from 'containers/following-page/store/reducers'
import history from 'containers/history-page/store/reducer'
import mobileUploadDrawer from 'containers/mobile-upload-drawer/store/slice'
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
import shareSoundToTikTokModal from 'containers/share-sound-to-tiktok-modal/store/slice'
import signOn from 'containers/sign-on/store/reducer'
import smartCollection from 'containers/smart-collection/store/slice'
import track from 'containers/track-page/store/reducer'
import trending from 'containers/trending-page/store/reducer'
import trendingPlaylists from 'containers/trending-playlists/store/slice'
import trendingUnderground from 'containers/trending-underground/store/slice'
import unfollowConfirmation from 'containers/unfollow-confirmation-modal/store/reducers'
import upload from 'containers/upload-page/store/reducer'
import visualizer from 'containers/visualizer/store/slice'
import account from 'store/account/reducer'
import appCTAModal from 'store/application/ui/app-cta-modal/slice'
import averageColor from 'store/application/ui/average-color/slice'
import cookieBanner from 'store/application/ui/cookieBanner/reducer'
import createPlaylistModal from 'store/application/ui/createPlaylistModal/reducer'
import editPlaylistModal from 'store/application/ui/editPlaylistModal/slice'
import editTrackModal from 'store/application/ui/editTrackModal/reducer'
import mobileKeyboard from 'store/application/ui/mobileKeyboard/reducer'
import mobileOverflowModal from 'store/application/ui/mobileOverflowModal/reducer'
import modals from 'store/application/ui/modals/slice'
import scrollLock from 'store/application/ui/scrollLock/reducer'
import setAsArtistPickConfirmation from 'store/application/ui/setAsArtistPickConfirmation/reducer'
import stemsUpload from 'store/application/ui/stemsUpload/slice'
import theme from 'store/application/ui/theme/reducer'
import userListModal from 'store/application/ui/userListModal/slice'
import audioManager from 'store/audio-manager/slice'
import backend from 'store/backend/reducer'
import collectionsReducer from 'store/cache/collections/reducer'
import { asCache } from 'store/cache/reducer'
import tracksReducer from 'store/cache/tracks/reducer'
import usersReducer from 'store/cache/users/reducer'
import confirmer from 'store/confirmer/reducer'
import dragndrop from 'store/dragndrop/reducer'
import player from 'store/player/slice'
import playlistLibrary from 'store/playlist-library/slice'
import queue from 'store/queue/slice'
import reachability from 'store/reachability/reducer'
import tokenDashboard from 'store/token-dashboard/slice'
import { Kind } from 'store/types'
import wallet from 'store/wallet/slice'

const createRootReducer = routeHistory =>
  combineReducers({
    // Router
    router: connectRouter(routeHistory),

    // Config
    backend,
    confirmer,
    reachability,

    // Account
    account,
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

    // Cache
    tracks: asCache(tracksReducer, Kind.TRACKS),
    collections: asCache(collectionsReducer, Kind.COLLECTIONS),
    users: asCache(usersReducer, Kind.USERS),

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
        averageColor,
        cookieBanner,
        createPlaylistModal,
        editPlaylistModal,
        editTrackModal,
        embedModal,
        enablePushNotificationsDrawer,
        firstUploadModal,
        mobileKeyboard,
        mobileOverflowModal,
        mobileUploadDrawer,
        modals,
        musicConfetti,
        remixSettingsModal,
        scrollLock,
        setAsArtistPickConfirmation,
        shareSoundToTikTokModal,
        stemsUpload,
        theme,
        userListModal,
        visualizer
      }),
      pages: combineReducers({
        addToPlaylist,
        deleted,
        deletePlaylistConfirmation,
        explore,
        exploreCollections,
        favorites,
        followers,
        following,
        notificationUsers,
        nowPlaying,
        remixes,
        reposts,
        rewardsPage,
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
