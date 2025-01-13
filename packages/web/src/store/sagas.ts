import {
  buyUSDCSagas,
  castSagas,
  chatSagas,
  reachabilitySagas as commonReachabilitySagas,
  remoteConfigSagas,
  deletePlaylistConfirmationModalUISagas as deletePlaylistConfirmationModalSagas,
  duplicateAddConfirmationModalUISagas as duplicateAddConfirmationModalSagas,
  mobileOverflowMenuUISagas as overflowMenuSagas,
  shareModalUISagas as shareModalSagas,
  stripeModalUISagas as stripeModalSagas,
  vipDiscordModalSagas,
  toastSagas,
  searchUsersModalSagas,
  modalsSagas,
  playerSagas as commonPlayerSagas,
  playbackPositionSagas,
  gatedContentSagas,
  purchaseContentSagas,
  confirmerSagas
} from '@audius/common/store'
import { sagaWithErrorHandler } from '@audius/common/utils'
import { all, spawn } from 'typed-redux-saga'

import addToCollectionSagas from 'common/store/add-to-collection/sagas'
import analyticsSagas from 'common/store/analytics/sagas'
import backendSagas from 'common/store/backend/sagas'
import collectionsSagas from 'common/store/cache/collections/webSagas'
import coreCacheSagas from 'common/store/cache/sagas'
import tracksSagas from 'common/store/cache/tracks/sagas'
import usersSagas from 'common/store/cache/users/sagas'
import changePasswordSagas from 'common/store/change-password/sagas'
import notificationSagas from 'common/store/notifications/sagas'
import rewardsPageSagas from 'common/store/pages/audio-rewards/sagas'
import collectionSagas from 'common/store/pages/collection/sagas'
import deactivateAccountSagas from 'common/store/pages/deactivate-account/sagas'
import exploreCollectionsPageSagas from 'common/store/pages/explore/exploreCollections/sagas'
import feedPageSagas from 'common/store/pages/feed/sagas'
import historySagas from 'common/store/pages/history/sagas'
import premiumTracksSagas from 'common/store/pages/premium-tracks/sagas'
import remixesSagas from 'common/store/pages/remixes-page/sagas'
import savedSagas from 'common/store/pages/saved/sagas'
import searchResultsSagas from 'common/store/pages/search-page/sagas'
import signOnSaga from 'common/store/pages/signon/sagas'
import trackPageSagas from 'common/store/pages/track/sagas'
import trendingPageSagas from 'common/store/pages/trending/sagas'
import trendingPlaylistSagas from 'common/store/pages/trending-playlists/sagas'
import trendingUndergroundSagas from 'common/store/pages/trending-underground/sagas'
import playerSagas from 'common/store/player/sagas'
import playlistLibrarySagas from 'common/store/playlist-library/sagas'
import playlistUpdatesSagas from 'common/store/playlist-updates/sagas'
import profileSagas from 'common/store/profile/sagas'
import queueSagas from 'common/store/queue/sagas'
import recoveryEmailSagas from 'common/store/recovery-email/sagas'
import remixSettingsSagas from 'common/store/remix-settings/sagas'
import savedCollectionsSagas from 'common/store/saved-collections/sagas'
import searchAiBarSagas from 'common/store/search-ai-bar/sagas'
import searchBarSagas from 'common/store/search-bar/sagas'
import smartCollectionPageSagas from 'common/store/smart-collection/sagas'
import socialSagas from 'common/store/social/sagas'
import tippingSagas from 'common/store/tipping/sagas'
import reactionSagas from 'common/store/ui/reactions/sagas'
import uploadSagas from 'common/store/upload/sagas'
import walletSagas from 'common/store/wallet/sagas'
import firstUploadModalSagas from 'components/first-upload-modal/store/sagas'
import passwordResetSagas from 'components/password-reset/store/sagas'
import dashboardSagas from 'pages/dashboard-page/store/sagas'
import deletedSagas from 'pages/deleted-page/store/sagas'
import settingsSagas from 'pages/settings-page/store/sagas'
import accountSagas from 'store/account/sagas'
import webAnalyticsSagas from 'store/analytics/sagas'
import buyAudioSagas from 'store/application/ui/buy-audio/sagas'
import chatWebSagas from 'store/application/ui/chat/sagas'
import cookieBannerSagas from 'store/application/ui/cookieBanner/sagas'
import scrollLockSagas from 'store/application/ui/scrollLock/sagas'
import stemUploadSagas from 'store/application/ui/stemsUpload/sagas'
import userListModalSagas from 'store/application/ui/userListModal/sagas'
import withdrawUSDCSagas from 'store/application/ui/withdraw-usdc/sagas'
import errorSagas from 'store/errors/sagas'
import reachabilitySagas from 'store/reachability/sagas'
import reloadSagas from 'store/reload/sagas'
import routingSagas from 'store/routing/sagas'
import signOutSagas from 'store/sign-out/sagas'
import tokenDashboardSagas from 'store/token-dashboard/sagas'

import notificationSagasWeb from './notifications/sagas'

export default function* rootSaga() {
  const sagas = ([] as (() => Generator<any, void, any>)[]).concat(
    // Config
    analyticsSagas(),
    webAnalyticsSagas(),
    backendSagas(),
    confirmerSagas(),
    searchBarSagas(),
    searchAiBarSagas(),

    cookieBannerSagas(),
    reachabilitySagas(),
    routingSagas(),

    // Account
    accountSagas(),
    playlistLibrarySagas(),
    playlistUpdatesSagas(),
    recoveryEmailSagas(),
    signOutSagas(),

    // Pages
    collectionSagas(),
    chatSagas(),
    dashboardSagas(),
    exploreCollectionsPageSagas(),
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
    settingsSagas(),
    signOnSaga(),
    socialSagas(),
    trackPageSagas(),
    trendingPageSagas(),
    trendingPlaylistSagas(),
    trendingUndergroundSagas(),
    uploadSagas(),
    premiumTracksSagas(),

    modalsSagas(),

    // Cache
    coreCacheSagas(),
    collectionsSagas(),
    tracksSagas(),
    usersSagas(),
    savedCollectionsSagas(),

    // Playback
    playerSagas(),
    commonPlayerSagas(),
    playbackPositionSagas(),
    queueSagas(),

    // Wallet
    walletSagas(),

    // Cast
    castSagas(),

    // Application
    addToCollectionSagas(),
    buyAudioSagas(),
    changePasswordSagas(),
    chatWebSagas(),
    deactivateAccountSagas(),
    deletedSagas(),
    deletePlaylistConfirmationModalSagas(),
    duplicateAddConfirmationModalSagas(),
    firstUploadModalSagas(),
    remixesSagas(),
    remixSettingsSagas(),
    scrollLockSagas(),
    shareModalSagas(),
    stripeModalSagas(),
    overflowMenuSagas(),
    toastSagas(),
    smartCollectionPageSagas(),
    searchUsersModalSagas(),
    stemUploadSagas(),
    tokenDashboardSagas(),
    userListModalSagas(),
    vipDiscordModalSagas(),
    commonReachabilitySagas(),

    // Remote config
    remoteConfigSagas(),

    // Tipping
    tippingSagas(),

    // Gated content
    gatedContentSagas(),
    buyUSDCSagas(),
    purchaseContentSagas(),
    withdrawUSDCSagas(),

    // Error
    errorSagas(),

    // Version refresh
    reloadSagas()
  )
  yield* all(sagas.map((saga) => spawn(sagaWithErrorHandler, saga)))
}
