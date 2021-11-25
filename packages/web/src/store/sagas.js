import { fork } from 'redux-saga/effects'

import collectionsSagas from 'common/store/cache/collections/sagas'
import coreCacheSagas from 'common/store/cache/sagas'
import tracksSagas from 'common/store/cache/tracks/sagas'
import usersSagas from 'common/store/cache/users/sagas'
import errorSagas from 'common/store/errors/sagas'
import addToPlaylistSagas from 'containers/add-to-playlist/store/sagas'
import dashboardSagas from 'containers/artist-dashboard-page/store/sagas'
import artistRecommendationsSagas from 'containers/artist-recommendations/store/sagas'
import rewardsPageSagas from 'containers/audio-rewards-page/store/sagas'
import changePasswordSagas from 'containers/change-password/store/sagas'
import collectionSagas from 'containers/collection-page/store/sagas'
import deactivateAccountSagas from 'containers/deactivate-account-page/store/sagas'
import deletedSagas from 'containers/deleted-page/store/sagas'
import exploreCollectionsPageSagas from 'containers/explore-page/store/collections/sagas'
import explorePageSagas from 'containers/explore-page/store/sagas'
import favoritePageSagas from 'containers/favorites-page/store/sagas'
import feedPageSagas from 'containers/feed-page/store/sagas'
import firstUploadModalSagas from 'containers/first-upload-modal/store/sagas'
import followersPageSagas from 'containers/followers-page/store/sagas'
import followingPageSagas from 'containers/following-page/store/sagas'
import historySagas from 'containers/history-page/store/sagas'
import notificationUsersPageSagas from 'containers/notification-users-page/store/sagas'
import notificationSagas from 'containers/notification/store/sagas'
import passwordResetSagas from 'containers/password-reset/store/sagas'
import profileSagas from 'containers/profile-page/store/sagas'
import remixSettingsModalSagas from 'containers/remix-settings-modal/store/sagas'
import remixesSagas from 'containers/remixes-page/store/sagas'
import remoteConfigSagas from 'containers/remote-config/sagas'
import repostPageSagas from 'containers/reposts-page/store/sagas'
import savedSagas from 'containers/saved-page/store/sagas'
import searchBarSagas from 'containers/search-bar/store/sagas'
import searchPageSagas from 'containers/search-page/store/sagas'
import serviceSelectionSagas from 'containers/service-selection/store/sagas'
import settingsSagas from 'containers/settings-page/store/sagas'
import shareSoundToTikTokModalSagas from 'containers/share-sound-to-tiktok-modal/store/sagas'
import signOnSaga from 'containers/sign-on/store/sagas'
import smartCollectionPageSagas from 'containers/smart-collection/store/sagas'
import trackSagas from 'containers/track-page/store/sagas'
import trendingPageSagas from 'containers/trending-page/store/sagas'
import trendingPlaylistSagas from 'containers/trending-playlists/store/sagas'
import trendingUndergroundSagas from 'containers/trending-underground/store/sagas'
import uploadSagas from 'containers/upload-page/store/sagas'
import { initInterface } from 'services/native-mobile-interface/helpers'
import accountSagas from 'store/account/sagas'
import analyticsSagas from 'store/analytics/sagas'
import cookieBannerSagas from 'store/application/ui/cookieBanner/sagas'
import scrollLockSagas from 'store/application/ui/scrollLock/sagas'
import stemUploadSagas from 'store/application/ui/stemsUpload/sagas'
import themeSagas from 'store/application/ui/theme/sagas'
import userListModalSagas from 'store/application/ui/userListModal/sagas'
import backendSagas, { setupBackend } from 'store/backend/sagas'
import confirmerSagas from 'store/confirmer/sagas'
import oauthSagas from 'store/oauth/sagas'
import playerSagas from 'store/player/sagas'
import playlistLibrarySagas from 'store/playlist-library/sagas'
import queueSagas from 'store/queue/sagas'
import reachabilitySagas from 'store/reachability/sagas'
import routingSagas from 'store/routing/sagas'
import socialSagas from 'store/social/sagas'
import tokenDashboardSagas from 'store/token-dashboard/sagas'
import walletSagas from 'store/wallet/sagas'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

export default function* rootSaga() {
  yield fork(setupBackend)
  const sagas = [].concat(
    // Config
    analyticsSagas(),
    backendSagas(),
    confirmerSagas(),
    cookieBannerSagas(),
    reachabilitySagas(),
    routingSagas(),

    // Account
    accountSagas(),
    playlistLibrarySagas(),

    // Pages
    collectionSagas(),
    dashboardSagas(),
    exploreCollectionsPageSagas(),
    explorePageSagas(),
    feedPageSagas(),
    historySagas(),
    notificationSagas(),
    passwordResetSagas(),
    profileSagas(),
    rewardsPageSagas(),
    savedSagas(),
    searchBarSagas(),
    searchPageSagas(),
    serviceSelectionSagas(),
    settingsSagas(),
    signOnSaga(),
    socialSagas(),
    trackSagas(),
    trendingPageSagas(),
    trendingPlaylistSagas(),
    trendingUndergroundSagas(),
    uploadSagas(),

    // Cache
    coreCacheSagas(),
    collectionsSagas(),
    tracksSagas(),
    usersSagas(),

    // Playback
    playerSagas(),
    queueSagas(),

    // Wallet
    walletSagas(),

    // Application
    addToPlaylistSagas(),
    artistRecommendationsSagas(),
    changePasswordSagas(),
    deactivateAccountSagas(),
    deletedSagas(),
    favoritePageSagas(),
    firstUploadModalSagas(),
    followersPageSagas(),
    followingPageSagas(),
    notificationUsersPageSagas(),
    remixesSagas(),
    remixSettingsModalSagas(),
    repostPageSagas(),
    scrollLockSagas(),
    shareSoundToTikTokModalSagas(),
    smartCollectionPageSagas(),
    stemUploadSagas(),
    themeSagas(),
    tokenDashboardSagas(),
    userListModalSagas(),
    oauthSagas(),

    // Remote config
    remoteConfigSagas(),

    // Error
    errorSagas()
  )
  if (NATIVE_MOBILE) {
    sagas.push(initInterface)
  }
  yield sagas.map(fork)
}
