import {
  castSagas,
  remoteConfigSagas as remoteConfig,
  deletePlaylistConfirmationModalUISagas as deletePlaylistConfirmationModalSagas,
  mobileOverflowMenuUISagas as overflowMenuSagas,
  shareModalUISagas as shareModalSagas,
  vipDiscordModalSagas
} from '@audius/common'
import analyticsSagas from 'audius-client/src/common/store/analytics/sagas'
import addToPlaylistSagas from 'common/store/add-to-playlist/sagas'
import backendSagas, { setupBackend } from 'common/store/backend/sagas'
import collectionsSagas from 'common/store/cache/collections/sagas'
import coreCacheSagas from 'common/store/cache/sagas'
import tracksSagas from 'common/store/cache/tracks/sagas'
import usersSagas from 'common/store/cache/users/sagas'
import changePasswordSagas from 'common/store/change-password/sagas'
import confirmerSagas from 'common/store/confirmer/sagas'
import rewardsPageSagas from 'common/store/pages/audio-rewards/sagas'
import collectionPageSagas from 'common/store/pages/collection/sagas'
import deactivateAccountSagas from 'common/store/pages/deactivate-account/sagas'
import exploreCollectionsPageSagas from 'common/store/pages/explore/exploreCollections/sagas'
import explorePageSagas from 'common/store/pages/explore/sagas'
import feedPageSagas from 'common/store/pages/feed/sagas'
import historySagas from 'common/store/pages/history/sagas'
import remixesSagas from 'common/store/pages/remixes-page/sagas'
import savedSagas from 'common/store/pages/saved/sagas'
import searchResultsSagas from 'common/store/pages/search-page/sagas'
import signOnSagas from 'common/store/pages/signon/sagas'
import tokenDashboardSagas from 'common/store/pages/token-dashboard/sagas'
import trackPageSagas from 'common/store/pages/track/sagas'
import trendingPlaylistSagas from 'common/store/pages/trending-playlists/sagas'
import trendingUndergroundSagas from 'common/store/pages/trending-underground/sagas'
import trendingPageSagas from 'common/store/pages/trending/sagas'
import playerSagas from 'common/store/player/sagas'
import playlistLibrarySagas from 'common/store/playlist-library/sagas'
import profileSagas from 'common/store/profile/sagas'
import queueSagas from 'common/store/queue/sagas'
import recoveryEmailSagas from 'common/store/recovery-email/sagas'
import searchBarSagas from 'common/store/search-bar/sagas'
import smartCollectionPageSagas from 'common/store/smart-collection/sagas'
import socialSagas from 'common/store/social/sagas'
import tippingSagas from 'common/store/tipping/sagas'
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
import { all, fork } from 'typed-redux-saga'

import accountSagas from './account/sagas'
import initKeyboardEvents from './keyboard/sagas'
import notificationsSagas from './notifications/sagas'
import oauthSagas from './oauth/sagas'
import settingsSagas from './settings/sagas'
import signOutSagas from './sign-out/sagas'
import themeSagas, { setupTheme } from './theme/sagas'

export default function* rootSaga() {
  yield* fork(setupBackend)
  yield* fork(setupTheme)
  const sagas = [
    // Config
    ...backendSagas(),
    ...analyticsSagas(),
    ...confirmerSagas(),
    ...searchBarSagas(),
    ...searchResultsSagas(),

    // Account

    ...accountSagas(),
    ...recoveryEmailSagas(),
    ...playlistLibrarySagas(),

    // Cache
    ...coreCacheSagas(),
    ...collectionsSagas(),
    ...tracksSagas(),
    ...usersSagas(),

    // Playback
    ...playerSagas(),
    ...queueSagas(),

    // Sign in / Sign out
    ...signOnSagas(),
    ...signOutSagas(),

    // Tipping
    ...tippingSagas(),

    ...walletSagas(),

    ...notificationsSagas(),

    // Pages
    ...trackPageSagas(),
    ...collectionPageSagas(),
    ...feedPageSagas(),
    ...exploreCollectionsPageSagas(),
    ...explorePageSagas(),
    ...trendingPageSagas(),
    ...trendingPlaylistSagas(),
    ...trendingUndergroundSagas(),
    ...savedSagas(),
    ...profileSagas(),
    ...reactionSagas(),
    ...socialSagas(),
    ...favoritePageSagas(),
    ...followersPageSagas(),
    ...followingPageSagas(),
    ...mutualsPageSagas(),
    ...notificationUsersPageSagas(),
    ...repostPageSagas(),
    ...supportingPageSagas(),
    ...topSupportersPageSagas(),
    ...historySagas(),
    ...rewardsPageSagas(),
    ...settingsSagas(),
    ...signOutSagas(),

    // Cast
    ...castSagas(),
    ...remixesSagas(),

    // Application
    ...addToPlaylistSagas(),
    ...changePasswordSagas(),
    ...smartCollectionPageSagas(),
    ...overflowMenuSagas(),
    ...deactivateAccountSagas(),
    ...deletePlaylistConfirmationModalSagas(),
    ...shareModalSagas(),
    ...vipDiscordModalSagas(),
    ...themeSagas(),
    ...tokenDashboardSagas(),

    initKeyboardEvents,
    ...remoteConfig(),
    ...oauthSagas()
  ]

  yield* all(sagas.map(fork))
}
