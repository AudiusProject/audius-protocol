import {
  castSagas,
  remoteConfigSagas,
  deletePlaylistConfirmationModalUISagas as deletePlaylistConfirmationModalSagas,
  mobileOverflowMenuUISagas as overflowMenuSagas,
  shareModalUISagas as shareModalSagas,
  toastSagas,
  vipDiscordModalSagas
} from '@audius/common'
import { all, fork } from 'redux-saga/effects'

import analyticsSagas from 'common/store/analytics/sagas'
import backendSagas, { setupBackend } from 'common/store/backend/sagas'
import collectionsSagas from 'common/store/cache/collections/sagas'
import coreCacheSagas from 'common/store/cache/sagas'
import tracksSagas from 'common/store/cache/tracks/sagas'
import usersSagas from 'common/store/cache/users/sagas'
import changePasswordSagas from 'common/store/change-password/sagas'
import confirmerSagas from 'common/store/confirmer/sagas'
import notificationSagas from 'common/store/notifications/sagas'
import oauthSagas from 'common/store/oauth/sagas'
import rewardsPageSagas from 'common/store/pages/audio-rewards/sagas'
import collectionSagas from 'common/store/pages/collection/sagas'
import deactivateAccountSagas from 'common/store/pages/deactivate-account/sagas'
import exploreCollectionsPageSagas from 'common/store/pages/explore/exploreCollections/sagas'
import explorePageSagas from 'common/store/pages/explore/sagas'
import feedPageSagas from 'common/store/pages/feed/sagas'
import historySagas from 'common/store/pages/history/sagas'
import savedSagas from 'common/store/pages/saved/sagas'
import searchResultsSagas from 'common/store/pages/search-page/sagas'
import signOnSaga from 'common/store/pages/signon/sagas'
import trackPageSagas from 'common/store/pages/track/sagas'
import trendingPlaylistSagas from 'common/store/pages/trending-playlists/sagas'
import trendingUndergroundSagas from 'common/store/pages/trending-underground/sagas'
import trendingPageSagas from 'common/store/pages/trending/sagas'
import playerSagas from 'common/store/player/sagas'
import playlistLibrarySagas from 'common/store/playlist-library/sagas'
import profileSagas from 'common/store/profile/sagas'
import queueSagas from 'common/store/queue/sagas'
import reachabilitySagas from 'common/store/reachability/sagas'
import recoveryEmailSagas from 'common/store/recovery-email/sagas'
import searchBarSagas from 'common/store/search-bar/sagas'
import serviceSelectionSagas from 'common/store/service-selection/sagas'
import smartCollectionPageSagas from 'common/store/smart-collection/sagas'
import socialSagas from 'common/store/social/sagas'
import tippingSagas from 'common/store/tipping/sagas'
import artistRecommendationsSagas from 'common/store/ui/artist-recommendations/sagas'
import reactionSagas from 'common/store/ui/reactions/sagas'
import favoritePageSagas from 'common/store/user-list/favorites/sagas'
import followersPageSagas from 'common/store/user-list/followers/sagas'
import followingPageSagas from 'common/store/user-list/following/sagas'
import mutualsPageSagas from 'common/store/user-list/mutuals/sagas'
import notificationUsersPageSagas from 'common/store/user-list/notifications/sagas'
import repostPageSagas from 'common/store/user-list/reposts/sagas'
import supportingPageSagas from 'common/store/user-list/supporting/sagas'
import topSupportersPageSagas from 'common/store/user-list/top-supporters/sagas'
import walletSagas from 'common/store/wallet/sagas'
import addToPlaylistSagas from 'components/add-to-playlist/store/sagas'
import firstUploadModalSagas from 'components/first-upload-modal/store/sagas'
import passwordResetSagas from 'components/password-reset/store/sagas'
import remixSettingsModalSagas from 'components/remix-settings-modal/store/sagas'
import shareSoundToTikTokModalSagas from 'components/share-sound-to-tiktok-modal/store/sagas'
import dashboardSagas from 'pages/artist-dashboard-page/store/sagas'
import deletedSagas from 'pages/deleted-page/store/sagas'
import remixesSagas from 'pages/remixes-page/store/sagas'
import searchPageTracksSagas from 'pages/search-page/store/lineups/tracks/sagas'
import settingsSagas from 'pages/settings-page/store/sagas'
import uploadSagas from 'pages/upload-page/store/sagas'
import { initInterface } from 'services/native-mobile-interface/helpers'
import accountSagas from 'store/account/sagas'
import webAnalyticsSagas from 'store/analytics/sagas'
import buyAudioSagas from 'store/application/ui/buy-audio/sagas'
import cookieBannerSagas from 'store/application/ui/cookieBanner/sagas'
import scrollLockSagas from 'store/application/ui/scrollLock/sagas'
import stemUploadSagas from 'store/application/ui/stemsUpload/sagas'
import themeSagas from 'store/application/ui/theme/sagas'
import userListModalSagas from 'store/application/ui/userListModal/sagas'
import errorSagas from 'store/errors/sagas'
import routingSagas from 'store/routing/sagas'
import signOutSagas from 'store/sign-out/sagas'
import solanaSagas from 'store/solana/sagas'
import tokenDashboardSagas from 'store/token-dashboard/sagas'

import notificationSagasWeb from './notifications/sagas'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

export default function* rootSaga() {
  yield fork(setupBackend)
  const sagas = ([] as (() => Generator<any, void, any>)[]).concat(
    // TODO(nkang): Move to common/store/pages/search-page/sagas once migrated
    searchPageTracksSagas(),

    // Config
    analyticsSagas(),
    webAnalyticsSagas(),
    backendSagas(),
    confirmerSagas(),
    searchBarSagas(),

    cookieBannerSagas(),
    reachabilitySagas(),
    routingSagas(),

    // Account
    accountSagas(),
    playlistLibrarySagas(),
    recoveryEmailSagas(),
    signOutSagas(),

    // Pages
    collectionSagas(),
    dashboardSagas(),
    exploreCollectionsPageSagas(),
    explorePageSagas(),
    feedPageSagas(),
    historySagas(),
    notificationSagas(),
    notificationSagasWeb(),
    passwordResetSagas(),
    profileSagas(),
    reactionSagas(),
    rewardsPageSagas(),
    savedSagas(),
    searchResultsSagas(),
    serviceSelectionSagas(),
    settingsSagas(),
    signOnSaga(),
    socialSagas(),
    trackPageSagas(),
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

    // Cast
    castSagas(),

    // Application
    addToPlaylistSagas(),
    artistRecommendationsSagas(),
    buyAudioSagas(),
    changePasswordSagas(),
    deactivateAccountSagas(),
    deletedSagas(),
    deletePlaylistConfirmationModalSagas(),
    favoritePageSagas(),
    firstUploadModalSagas(),
    followersPageSagas(),
    followingPageSagas(),
    supportingPageSagas(),
    topSupportersPageSagas(),
    mutualsPageSagas(),
    notificationUsersPageSagas(),
    remixesSagas(),
    remixSettingsModalSagas(),
    repostPageSagas(),
    scrollLockSagas(),
    shareModalSagas(),
    overflowMenuSagas(),
    toastSagas(),
    shareSoundToTikTokModalSagas(),
    smartCollectionPageSagas(),
    stemUploadSagas(),
    themeSagas(),
    tokenDashboardSagas(),
    userListModalSagas(),
    oauthSagas(),
    vipDiscordModalSagas(),

    // Remote config
    remoteConfigSagas(),

    // Solana
    solanaSagas(),

    // Tipping
    tippingSagas(),

    // Error
    errorSagas()
  )
  if (NATIVE_MOBILE) {
    sagas.push(initInterface)
  }
  yield all(sagas.map(fork))
}
