import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import { Kind } from 'store/types'
import { asCache } from 'store/cache/reducer'

import backend from 'store/backend/reducer'
import confirmer from 'store/confirmer/reducer'
import reachability from 'store/reachability/reducer'

import dragndrop from 'store/dragndrop/reducer'

import visualizer from 'containers/visualizer/store/slice'
import upload from 'containers/upload-page/store/reducer'
import profile from 'containers/profile-page/store/reducer'
import dashboard from 'containers/artist-dashboard-page/store/reducer'
import signOn from 'containers/sign-on/store/reducer'
import discover from 'containers/discover-page/store/reducer'
import explore from 'containers/explore-page/store/reducer'
import exploreCollections from 'containers/explore-page/store/collections/slice'
import history from 'containers/history-page/store/reducer'
import saved from 'containers/saved-page/store/reducer'
import searchBar from 'containers/search-bar/store/reducer'
import search from 'containers/search-page/store/reducer'
import collection from 'containers/collection-page/store/reducer'
import smartCollection from 'containers/smart-collection/store/slice'
import track from 'containers/track-page/store/reducer'
import remixes from 'containers/remixes-page/store/slice'
import deleted from 'containers/deleted-page/store/slice'
import notification from 'containers/notification/store/reducer'
import serviceSelection from 'containers/service-selection/store/slice'
import passwordReset from 'containers/password-reset/store/reducer'
import settings from 'containers/settings-page/store/reducer'
import reposts from 'containers/reposts-page/store/reducers'
import favorites from 'containers/favorites-page/store/reducers'
import following from 'containers/following-page/store/reducers'
import followers from 'containers/followers-page/store/reducers'
import notificationUsers from 'containers/notification-users-page/store/reducers'
import unfollowConfirmation from 'containers/unfollow-confirmation-modal/store/reducers'
import deletePlaylistConfirmation from 'containers/delete-playlist-confirmation-modal/store/reducers'
import embedModal from 'containers/embed-modal/store/reducers'
import addToPlaylist from 'containers/add-to-playlist/store/reducers'
import nowPlaying from 'containers/now-playing/store/reducers'
import firstUploadModal from 'containers/first-upload-modal/store/slice'
import remixSettingsModal from 'containers/remix-settings-modal/store/slice'
import remoteConfig from 'containers/remote-config/slice'
import musicConfetti from 'containers/music-confetti/store/slice'

import account from 'store/account/reducer'
import tracksReducer from 'store/cache/tracks/reducer'
import collectionsReducer from 'store/cache/collections/reducer'
import usersReducer from 'store/cache/users/reducer'

import queue from 'store/queue/slice'
import player from 'store/player/slice'
import tokenDashboard from 'store/token-dashboard/slice'

import setAsArtistPickConfirmation from 'store/application/ui/setAsArtistPickConfirmation/reducer'
import browserPushPermissionConfirmation from 'store/application/ui/browserPushPermissionConfirmation/reducer'
import createPlaylistModal from 'store/application/ui/createPlaylistModal/reducer'
import editTrackModal from 'store/application/ui/editTrackModal/reducer'
import theme from 'store/application/ui/theme/reducer'
import scrollLock from 'store/application/ui/scrollLock/reducer'
import cookieBanner from 'store/application/ui/cookieBanner/reducer'
import mobileOverflowModal from 'store/application/ui/mobileOverflowModal/reducer'
import mobileKeyboard from 'store/application/ui/mobileKeyboard/reducer'
import userListModal from 'store/application/ui/userListModal/slice'
import stemsUpload from 'store/application/ui/stemsUpload/slice'
import appCTAModal from 'store/application/ui/app-cta-modal/slice'

import wallet from 'store/wallet/slice'

const createRootReducer = routeHistory =>
  combineReducers({
    // Config
    backend,
    account,
    passwordReset,
    confirmer,
    reachability,

    // UI Functions
    dragndrop,

    // Pages
    upload,
    profile,
    dashboard,
    signOn,
    discover,
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

    router: connectRouter(routeHistory),

    // Remote config/flags
    remoteConfig,

    // Wallet
    wallet,

    application: combineReducers({
      ui: combineReducers({
        createPlaylistModal,
        editTrackModal,
        embedModal,
        theme,
        scrollLock,
        cookieBanner,
        setAsArtistPickConfirmation,
        browserPushPermissionConfirmation,
        mobileOverflowModal,
        mobileKeyboard,
        userListModal,
        firstUploadModal,
        visualizer,
        remixSettingsModal,
        stemsUpload,
        appCTAModal,
        musicConfetti
      }),
      pages: combineReducers({
        explore,
        exploreCollections,
        smartCollection,
        settings,
        reposts,
        favorites,
        following,
        followers,
        notificationUsers,
        unfollowConfirmation,
        deletePlaylistConfirmation,
        addToPlaylist,
        remixes,
        deleted,
        nowPlaying,
        tokenDashboard
      })
    })
  })

export default createRootReducer
