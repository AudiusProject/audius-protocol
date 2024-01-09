import { lazy, Component, Suspense } from 'react'

import {
  Client,
  Name,
  SmartCollectionVariant,
  Status,
  Theme,
  StringKeys,
  accountSelectors,
  ExploreCollectionsVariant,
  themeSelectors,
  themeActions,
  UploadType,
  FeatureFlags
} from '@audius/common'
import cn from 'classnames'
import { connect } from 'react-redux'
import { matchPath } from 'react-router'
import { Switch, Route, Redirect, withRouter } from 'react-router-dom'
import semver from 'semver'

import { make } from 'common/store/analytics/actions'
import {
  openSignOn,
  updateRouteOnCompletion as updateRouteOnSignUpCompletion
} from 'common/store/pages/signon/actions'
import { getStatus as getSignOnStatus } from 'common/store/pages/signon/selectors'
import { Pages as SignOnPages } from 'common/store/pages/signon/types'
import AnimatedSwitch from 'components/animated-switch/AnimatedSwitch'
import AppRedirectListener from 'components/app-redirect-popover/AppRedirectListener'
import { AppRedirectPopover } from 'components/app-redirect-popover/components/AppRedirectPopover'
import { AppBannerWrapper } from 'components/banner/AppBannerWrapper'
import { DownloadAppBanner } from 'components/banner/DownloadAppBanner'
import { UpdateAppBanner } from 'components/banner/UpdateAppBanner'
import { Web3ErrorBanner } from 'components/banner/Web3ErrorBanner'
import { ChatListener } from 'components/chat-listener/ChatListener'
import { ClientOnly } from 'components/client-only/ClientOnly'
import CookieBanner from 'components/cookie-banner/CookieBanner'
import { DevModeMananger } from 'components/dev-mode-manager/DevModeManager'
import { HeaderContextConsumer } from 'components/header/mobile/HeaderContextProvider'
import Konami from 'components/konami/Konami'
import Navigator from 'components/nav/Navigator'
import TopLevelPage from 'components/nav/mobile/TopLevelPage'
import Notice from 'components/notice/Notice'
import { NotificationPage } from 'components/notification'
import PinnedTrackConfirmation from 'components/pin-track-confirmation/PinTrackConfirmation'
import PlayBarProvider from 'components/play-bar/PlayBarProvider'
import { RewardClaimedToast } from 'components/reward-claimed-toast/RewardClaimedToast'
import DesktopRoute from 'components/routes/DesktopRoute'
import MobileRoute from 'components/routes/MobileRoute'
import TrendingGenreSelectionPage from 'components/trending-genre-selection/TrendingGenreSelectionPage'
import { USDCBalanceFetcher } from 'components/usdc-balance-fetcher/USDCBalanceFetcher'
import {
  MainContentContext,
  MainContentContextProvider,
  MAIN_CONTENT_ID
} from 'pages/MainContentContext'
import { AiAttributedTracksPage } from 'pages/ai-attributed-tracks-page'
import { AudioRewardsPage } from 'pages/audio-rewards-page/AudioRewardsPage'
import { AudioTransactionsPage } from 'pages/audio-transactions-page'
import { ChatPageProvider } from 'pages/chat-page/ChatPageProvider'
import CheckPage from 'pages/check-page/CheckPage'
import { CollectiblesPlaylistPage } from 'pages/collectibles-playlist-page'
import CollectionPage from 'pages/collection-page/CollectionPage'
import { DashboardPage } from 'pages/dashboard-page/DashboardPage'
import { DeactivateAccountPage } from 'pages/deactivate-account-page/DeactivateAccountPage'
import EmptyPage from 'pages/empty-page/EmptyPage'
import ExploreCollectionsPage from 'pages/explore-page/ExploreCollectionsPage'
import ExplorePage from 'pages/explore-page/ExplorePage'
import FavoritesPage from 'pages/favorites-page/FavoritesPage'
import { FbSharePage } from 'pages/fb-share-page/FbSharePage'
import FeedPage from 'pages/feed-page/FeedPage'
import FollowersPage from 'pages/followers-page/FollowersPage'
import FollowingPage from 'pages/following-page/FollowingPage'
import HistoryPage from 'pages/history-page/HistoryPage'
import NotFoundPage from 'pages/not-found-page/NotFoundPage'
import NotificationUsersPage from 'pages/notification-users-page/NotificationUsersPage'
import { PayAndEarnPage } from 'pages/pay-and-earn-page/PayAndEarnPage'
import { TableType } from 'pages/pay-and-earn-page/types'
import { PremiumTracksPage } from 'pages/premium-tracks-page/PremiumTracksPage'
import ProfilePage from 'pages/profile-page/ProfilePage'
import RemixesPage from 'pages/remixes-page/RemixesPage'
import RepostsPage from 'pages/reposts-page/RepostsPage'
import RequiresUpdate from 'pages/requires-update/RequiresUpdate'
import SavedPage from 'pages/saved-page/SavedPage'
import SearchPage from 'pages/search-page/SearchPage'
import SettingsPage from 'pages/settings-page/SettingsPage'
import { SubPage } from 'pages/settings-page/components/mobile/SettingsPage'
import SmartCollectionPage from 'pages/smart-collection/SmartCollectionPage'
import SupportingPage from 'pages/supporting-page/SupportingPage'
import TopSupportersPage from 'pages/top-supporters-page/TopSupportersPage'
import TrackPage from 'pages/track-page/TrackPage'
import TrendingPage from 'pages/trending-page/TrendingPage'
import TrendingPlaylistsPage from 'pages/trending-playlists/TrendingPlaylistPage'
import TrendingUndergroundPage from 'pages/trending-underground/TrendingUndergroundPage'
import Visualizer from 'pages/visualizer/Visualizer'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { initializeSentry } from 'services/sentry'
import { SsrContext } from 'ssr/SsrContext'
import { setVisibility as setAppModalCTAVisibility } from 'store/application/ui/app-cta-modal/slice'
import { getShowCookieBanner } from 'store/application/ui/cookieBanner/selectors'
import {
  incrementScrollCount as incrementScrollCountAction,
  decrementScrollCount as decrementScrollCountAction
} from 'store/application/ui/scrollLock/actions'
import { getClient } from 'utils/clientUtil'
import 'utils/redirect'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  NOTIFICATION_PAGE,
  NOTIFICATION_USERS_PAGE,
  EXPLORE_PAGE,
  EXPLORE_HEAVY_ROTATION_PAGE,
  EXPLORE_LET_THEM_DJ_PAGE,
  EXPLORE_BEST_NEW_RELEASES_PAGE,
  EXPLORE_UNDER_THE_RADAR_PAGE,
  EXPLORE_TOP_ALBUMS_PAGE,
  EXPLORE_MOST_LOVED_PAGE,
  EXPLORE_FEELING_LUCKY_PAGE,
  EXPLORE_MOOD_PLAYLISTS_PAGE,
  SAVED_PAGE,
  LIBRARY_PAGE,
  HISTORY_PAGE,
  DASHBOARD_PAGE,
  AUDIO_PAGE,
  AUDIO_TRANSACTIONS_PAGE,
  UPLOAD_PAGE,
  UPLOAD_ALBUM_PAGE,
  UPLOAD_PLAYLIST_PAGE,
  SETTINGS_PAGE,
  HOME_PAGE,
  NOT_FOUND_PAGE,
  SEARCH_CATEGORY_PAGE,
  SEARCH_PAGE,
  PLAYLIST_PAGE,
  ALBUM_PAGE,
  TRACK_PAGE,
  TRACK_REMIXES_PAGE,
  PROFILE_PAGE,
  authenticatedRoutes,
  EMPTY_PAGE,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE,
  ACCOUNT_SETTINGS_PAGE,
  CHANGE_PASSWORD_SETTINGS_PAGE,
  ACCOUNT_VERIFICATION_SETTINGS_PAGE,
  NOTIFICATION_SETTINGS_PAGE,
  ABOUT_SETTINGS_PAGE,
  FOLLOWING_USERS_ROUTE,
  FOLLOWERS_USERS_ROUTE,
  TRENDING_GENRES,
  APP_REDIRECT,
  TRACK_ID_PAGE,
  USER_ID_PAGE,
  PLAYLIST_ID_PAGE,
  TRENDING_PLAYLISTS_PAGE,
  PROFILE_PAGE_COLLECTIBLES,
  PROFILE_PAGE_COLLECTIBLE_DETAILS,
  PROFILE_PAGE_TRACKS,
  PROFILE_PAGE_ALBUMS,
  PROFILE_PAGE_PLAYLISTS,
  PROFILE_PAGE_REPOSTS,
  TRENDING_UNDERGROUND_PAGE,
  EXPLORE_REMIXABLES_PAGE,
  CHECK_PAGE,
  getPathname,
  TRENDING_PLAYLISTS_PAGE_LEGACY,
  AUDIO_NFT_PLAYLIST_PAGE,
  DEACTIVATE_PAGE,
  SUPPORTING_USERS_ROUTE,
  TOP_SUPPORTERS_USERS_ROUTE,
  publicSiteRoutes,
  CHAT_PAGE,
  PROFILE_PAGE_AI_ATTRIBUTED_TRACKS,
  EXPLORE_PREMIUM_TRACKS_PAGE,
  PAYMENTS_PAGE,
  WITHDRAWALS_PAGE,
  PURCHASES_PAGE,
  SALES_PAGE
} from 'utils/route'
import { getTheme as getSystemTheme } from 'utils/theme/theme'

import styles from './WebPlayer.module.css'

const { setTheme } = themeActions
const { getTheme } = themeSelectors

const { getHasAccount, getAccountStatus, getUserId, getUserHandle } =
  accountSelectors

const UploadPage = lazy(() => import('pages/upload-page'))
const Modals = lazy(() => import('pages/modals/Modals'))
const ConnectedMusicConfetti = lazy(() =>
  import('components/music-confetti/ConnectedMusicConfetti')
)

const includeSearch = (search) => {
  return search.includes('oauth_token') || search.includes('code')
}

initializeSentry()

class WebPlayer extends Component {
  static contextType = SsrContext

  state = {
    mainContent: null,

    // A patch version update of the web app is available
    showWebUpdateBanner: false,
    // A version update of the web app is required
    showRequiresWebUpdate: false,
    // A minor version update of the entire electron app is required
    showRequiresUpdate: false,

    isUpdating: false,

    initialPage: true,
    entryRoute: getPathname(this.props.history.location),
    currentRoute: getPathname(this.props.history.location)
  }

  ipc = null

  scrollToTop = () => {
    this.props.mainContentRef.current &&
      this.props.mainContentRef.current.scrollTo &&
      this.props.mainContentRef.current.scrollTo({ top: 0 })
  }

  componentDidMount() {
    const client = getClient()

    this.removeHistoryEventListener = this.props.history.listen(
      (location, action) => {
        this.scrollToTop()
        this.setState({
          initialPage: false,
          currentRoute: getPathname(this.props.history.location)
        })
      }
    )

    if (client === Client.ELECTRON) {
      this.ipc = window.require('electron').ipcRenderer
      // We downloaded an update, the user can safely restart
      this.ipc.on('updateDownloaded', (event, arg) => {
        console.info('updateDownload', event, arg)
      })

      this.ipc.on('updateDownloadProgress', (event, arg) => {
        console.info('updateDownloadProgress', event, arg)
      })

      this.ipc.on('updateError', (event, arg) => {
        console.error('updateError', event, arg)
      })

      // This is for patch updates so that only the web assets are updated
      this.ipc.on('webUpdateAvailable', async (event, arg) => {
        console.info('webUpdateAvailable', event, arg)
        const { currentVersion } = arg
        await remoteConfigInstance.waitForRemoteConfig()
        const minAppVersion = remoteConfigInstance.getRemoteVar(
          StringKeys.MIN_APP_VERSION
        )

        if (semver.lt(currentVersion, minAppVersion)) {
          this.setState({ showRequiresWebUpdate: true })
        } else {
          this.setState({ showWebUpdateBanner: true })
        }
      })

      // There is an update available, the user should update if it's
      // more than a minor version.
      this.ipc.on('updateAvailable', (event, arg) => {
        console.info('updateAvailable', event, arg)
        const { version, currentVersion } = arg
        if (
          semver.major(currentVersion) < semver.major(version) ||
          semver.minor(currentVersion) < semver.minor(version)
        ) {
          this.setState({ showRequiresUpdate: true })
        }
      })

      if (typeof window !== 'undefined') {
        const windowOpen = window.open

        const a = document.createElement('a')
        window.open = (...args) => {
          const url = args[0]
          if (!url) {
            const popup = windowOpen(window.location)
            const win = {
              popup,
              closed: popup.closed,
              close: () => {
                popup.close()
              }
            }
            Object.defineProperty(win, 'location', {
              get: () => {
                a.href = popup.location
                if (!a.search) {
                  return {
                    href: popup.location,
                    search: a.search,
                    hostname: ''
                  }
                }
                return {
                  href: popup.location,
                  search: a.search,
                  hostname: a.hostname
                }
              },
              set: (locationHref) => {
                popup.location = locationHref
                this.locationHref = locationHref
              }
            })
            return win
          }
          return windowOpen(...args)
        }
      }
    }

    this.handleTheme()
  }

  componentDidUpdate(prevProps) {
    if (
      !this.props.hasAccount &&
      this.props.accountStatus !== Status.LOADING &&
      authenticatedRoutes.some((route) => {
        const match = matchPath(getPathname(this.props.location), {
          path: route,
          exact: true
        })
        return !!match
      })
    ) {
      if (prevProps.accountStatus === Status.LOADING) {
        this.pushWithToken(TRENDING_PAGE)
        // If native mobile, a saga watches for fetch account failure to push route
        this.props.openSignOn(true, SignOnPages.SIGNIN)
        this.props.updateRouteOnSignUpCompletion(this.state.entryRoute)
      } else {
        this.pushWithToken(TRENDING_PAGE)
      }
    }

    if (prevProps.theme !== this.props.theme) {
      this.handleTheme()
    }
  }

  componentWillUnmount() {
    const client = getClient()

    this.removeHistoryEventListener()

    if (client === Client.ELECTRON) {
      this.ipc.removeAllListeners('updateDownloaded')
      this.ipc.removeAllListeners('updateAvailable')
    }
  }

  handleTheme() {
    // Set local theme
    if (this.props.theme === null) {
      this.props.setTheme(getSystemTheme() || Theme.DEFAULT)
    }
  }

  pushWithToken = (route) => {
    const search = this.props.location.search
    // Twitter and instagram search params
    if (includeSearch(search)) {
      this.props.history.push(`${route}${search}`)
    } else {
      this.props.history.push(route)
    }
  }

  acceptUpdateApp = () => {
    this.setState({ isUpdating: true })
    this.ipc.send('update')
  }

  acceptWebUpdate = () => {
    if (this.state.showWebUpdateBanner) {
      this.dismissUpdateWebAppBanner()
    } else if (this.state.showRequiresWebUpdate) {
      this.dismissRequiresWebUpdate()
    }
    this.setState({ isUpdating: true })
    this.ipc.send('web-update')
  }

  dismissUpdateWebAppBanner = () => {
    this.setState({ showWebUpdateBanner: false })
  }

  dismissRequiresWebUpdate = () => {
    this.setState({ showRequiresWebUpdate: false })
  }

  showDownloadAppModal = () => {
    this.props.recordClickCTABanner()
    this.props.showAppCTAModal()
  }

  render() {
    const { theme, incrementScroll, decrementScroll, userHandle } = this.props

    const {
      showWebUpdateBanner,
      isUpdating,
      showRequiresUpdate,
      showRequiresWebUpdate,
      initialPage
    } = this.state

    const isMobile = this.context.isMobile

    if (showRequiresUpdate)
      return (
        <RequiresUpdate
          theme={theme}
          isUpdating={isUpdating}
          onUpdate={this.acceptUpdateApp}
        />
      )

    if (showRequiresWebUpdate)
      return (
        <RequiresUpdate
          theme={theme}
          isUpdating={isUpdating}
          onUpdate={this.acceptWebUpdate}
        />
      )

    const SwitchComponent = this.context.isMobile ? AnimatedSwitch : Switch
    const noScroll = matchPath(this.state.currentRoute, CHAT_PAGE)

    return (
      <div className={styles.root}>
        <AppBannerWrapper>
          <DownloadAppBanner />

          {/* Product Announcement Banners */}
          {/* <DirectMessagesBanner /> */}
          {/* <TermsOfServiceUpdateBanner /> */}

          <Web3ErrorBanner />
          {/* Other banners' logic is self-contained, but since this one uses the IPC
            and can result in either required or optional updates, keeping the visibility
            controlled from this parent for now */}
          {showWebUpdateBanner ? (
            <UpdateAppBanner
              onAccept={this.acceptWebUpdate}
              onClose={this.dismissUpdateWebAppBanner}
            />
          ) : null}
        </AppBannerWrapper>
        {this.props.isChatEnabled ? <ChatListener /> : null}
        <USDCBalanceFetcher />
        <div className={cn(styles.app, { [styles.mobileApp]: isMobile })}>
          {this.props.showCookieBanner ? <CookieBanner /> : null}
          <Notice />
          <Navigator />
          <div
            ref={this.props.mainContentRef}
            id={MAIN_CONTENT_ID}
            role='main'
            className={cn(styles.mainContentWrapper, {
              [styles.mainContentWrapperMobile]: isMobile,
              [styles.noScroll]: noScroll
            })}
          >
            {isMobile && <TopLevelPage />}
            {isMobile && <HeaderContextConsumer />}

            <Suspense fallback={null}>
              <SwitchComponent isInitialPage={initialPage} handle={userHandle}>
                {publicSiteRoutes.map((route) => (
                  // Redirect all public site routes to the corresponding pathname.
                  // This is necessary first because otherwise pathnames like
                  // legal/privacy-policy will match the track route.
                  <Redirect
                    key={route}
                    from={route}
                    to={{ pathname: getPathname({ pathname: '' }) }}
                  />
                ))}

                <Route
                  exact
                  path={'/fb/share'}
                  render={(props) => <FbSharePage />}
                />
                <Route
                  exact
                  path={FEED_PAGE}
                  isMobile={isMobile}
                  render={() => (
                    <FeedPage
                      containerRef={this.props.mainContentRef.current}
                    />
                  )}
                />
                <Route
                  exact
                  path={NOTIFICATION_USERS_PAGE}
                  isMobile={isMobile}
                  component={NotificationUsersPage}
                />
                <Route
                  exact
                  path={NOTIFICATION_PAGE}
                  isMobile={isMobile}
                  component={NotificationPage}
                />
                <MobileRoute
                  exact
                  path={TRENDING_GENRES}
                  isMobile={isMobile}
                  component={TrendingGenreSelectionPage}
                />
                <Route
                  exact
                  path={TRENDING_PAGE}
                  render={() => (
                    <TrendingPage
                      containerRef={this.props.mainContentRef.current}
                    />
                  )}
                />
                <Redirect
                  from={TRENDING_PLAYLISTS_PAGE_LEGACY}
                  to={TRENDING_PLAYLISTS_PAGE}
                />
                <Route
                  exact
                  path={TRENDING_PLAYLISTS_PAGE}
                  render={() => (
                    <TrendingPlaylistsPage
                      containerRef={this.props.mainContentRef.current}
                    />
                  )}
                />
                <Route
                  exact
                  path={TRENDING_UNDERGROUND_PAGE}
                  render={() => (
                    <TrendingUndergroundPage
                      containerRef={this.props.mainContentRef.current}
                    />
                  )}
                />
                <Route
                  exact
                  path={EXPLORE_REMIXABLES_PAGE}
                  render={() => (
                    <SmartCollectionPage
                      variant={SmartCollectionVariant.REMIXABLES}
                    />
                  )}
                />
                <Route
                  exact
                  path={EXPLORE_PAGE}
                  render={() => <ExplorePage />}
                />
                <Route
                  exact
                  path={AUDIO_NFT_PLAYLIST_PAGE}
                  render={() => <CollectiblesPlaylistPage />}
                />
                <Route
                  exact
                  path={EXPLORE_PREMIUM_TRACKS_PAGE}
                  render={() => (
                    <PremiumTracksPage
                      containerRef={this.props.mainContentRef.current}
                    />
                  )}
                />
                <Route
                  exact
                  path={EXPLORE_HEAVY_ROTATION_PAGE}
                  render={() => (
                    <SmartCollectionPage
                      variant={SmartCollectionVariant.HEAVY_ROTATION}
                    />
                  )}
                />
                <Route
                  exact
                  path={EXPLORE_LET_THEM_DJ_PAGE}
                  render={() => (
                    <ExploreCollectionsPage
                      variant={ExploreCollectionsVariant.LET_THEM_DJ}
                    />
                  )}
                />
                <Route
                  exact
                  path={EXPLORE_BEST_NEW_RELEASES_PAGE}
                  render={() => (
                    <SmartCollectionPage
                      variant={SmartCollectionVariant.BEST_NEW_RELEASES}
                    />
                  )}
                />
                <Route
                  exact
                  path={EXPLORE_UNDER_THE_RADAR_PAGE}
                  render={() => (
                    <SmartCollectionPage
                      variant={SmartCollectionVariant.UNDER_THE_RADAR}
                    />
                  )}
                />
                <Route
                  exact
                  path={EXPLORE_TOP_ALBUMS_PAGE}
                  render={() => (
                    <ExploreCollectionsPage
                      variant={ExploreCollectionsVariant.TOP_ALBUMS}
                    />
                  )}
                />
                <Route
                  exact
                  path={EXPLORE_MOST_LOVED_PAGE}
                  render={() => (
                    <SmartCollectionPage
                      variant={SmartCollectionVariant.MOST_LOVED}
                    />
                  )}
                />
                <Route
                  exact
                  path={EXPLORE_FEELING_LUCKY_PAGE}
                  render={() => (
                    <SmartCollectionPage
                      variant={SmartCollectionVariant.FEELING_LUCKY}
                    />
                  )}
                />
                <Route
                  exact
                  path={EXPLORE_MOOD_PLAYLISTS_PAGE}
                  render={() => (
                    <ExploreCollectionsPage
                      variant={ExploreCollectionsVariant.MOOD}
                    />
                  )}
                />

                <Route
                  path={SEARCH_CATEGORY_PAGE}
                  render={(props) => (
                    <SearchPage
                      {...props}
                      scrollToTop={this.scrollToTop}
                      containerRef={this.props.mainContentRef.current}
                    />
                  )}
                />
                <Route
                  path={SEARCH_PAGE}
                  render={(props) => (
                    <SearchPage
                      {...props}
                      scrollToTop={this.scrollToTop}
                      containerRef={this.props.mainContentRef.current}
                    />
                  )}
                />

                <DesktopRoute
                  path={UPLOAD_ALBUM_PAGE}
                  isMobile={isMobile}
                  render={() => <UploadPage uploadType={UploadType.ALBUM} />}
                />
                <DesktopRoute
                  path={UPLOAD_PLAYLIST_PAGE}
                  isMobile={isMobile}
                  render={() => <UploadPage uploadType={UploadType.PLAYLIST} />}
                />
                <DesktopRoute
                  path={UPLOAD_PAGE}
                  isMobile={isMobile}
                  render={(props) => (
                    <UploadPage {...props} scrollToTop={this.scrollToTop} />
                  )}
                />

                <Route
                  exact
                  path={[SAVED_PAGE, LIBRARY_PAGE]}
                  component={SavedPage}
                />
                <Route exact path={HISTORY_PAGE} component={HistoryPage} />
                <DesktopRoute
                  exact
                  path={DASHBOARD_PAGE}
                  isMobile={isMobile}
                  component={DashboardPage}
                />
                <Route
                  exact
                  path={WITHDRAWALS_PAGE}
                  isMobile={isMobile}
                  render={(props) => (
                    <PayAndEarnPage
                      {...props}
                      tableView={TableType.WITHDRAWALS}
                    />
                  )}
                />
                <Route
                  exact
                  path={PURCHASES_PAGE}
                  isMobile={isMobile}
                  render={(props) => (
                    <PayAndEarnPage
                      {...props}
                      tableView={TableType.PURCHASES}
                    />
                  )}
                />
                <Route
                  exact
                  path={SALES_PAGE}
                  isMobile={isMobile}
                  render={(props) => (
                    <PayAndEarnPage {...props} tableView={TableType.SALES} />
                  )}
                />
                <Route
                  exact
                  path={PAYMENTS_PAGE}
                  isMobile={isMobile}
                  component={PayAndEarnPage}
                />
                <Route
                  exact
                  path={AUDIO_PAGE}
                  isMobile={isMobile}
                  component={AudioRewardsPage}
                />
                <Route
                  exact
                  path={AUDIO_TRANSACTIONS_PAGE}
                  isMobile={isMobile}
                  component={AudioTransactionsPage}
                />
                <Route
                  exact
                  path={CHAT_PAGE}
                  isMobile={isMobile}
                  component={ChatPageProvider}
                />
                <Route
                  exact
                  path={DEACTIVATE_PAGE}
                  isMobile={isMobile}
                  component={DeactivateAccountPage}
                />
                <Route
                  exact
                  path={SETTINGS_PAGE}
                  isMobile={isMobile}
                  component={SettingsPage}
                />
                <Route exact path={CHECK_PAGE} component={CheckPage} />
                <MobileRoute
                  exact
                  path={ACCOUNT_SETTINGS_PAGE}
                  isMobile={isMobile}
                  render={() => <SettingsPage subPage={SubPage.ACCOUNT} />}
                />
                <MobileRoute
                  exact
                  path={ACCOUNT_VERIFICATION_SETTINGS_PAGE}
                  isMobile={isMobile}
                  render={() => <SettingsPage subPage={SubPage.VERIFICATION} />}
                />
                <MobileRoute
                  exact
                  path={CHANGE_PASSWORD_SETTINGS_PAGE}
                  isMobile={isMobile}
                  render={() => (
                    <SettingsPage subPage={SubPage.CHANGE_PASSWORD} />
                  )}
                />
                <MobileRoute
                  exact
                  path={NOTIFICATION_SETTINGS_PAGE}
                  isMobile={isMobile}
                  render={() => (
                    <SettingsPage subPage={SubPage.NOTIFICATIONS} />
                  )}
                />
                <MobileRoute
                  exact
                  path={ABOUT_SETTINGS_PAGE}
                  isMobile={isMobile}
                  render={() => <SettingsPage subPage={SubPage.ABOUT} />}
                />

                <Route path={APP_REDIRECT} component={AppRedirectListener} />
                <Route exact path={NOT_FOUND_PAGE} component={NotFoundPage} />

                <Route
                  exact
                  path={PLAYLIST_PAGE}
                  render={({ location }) => {
                    return (
                      <CollectionPage key={location.pathname} type='playlist' />
                    )
                  }}
                />
                <Route
                  exact
                  path={ALBUM_PAGE}
                  render={({ location }) => (
                    <CollectionPage key={location.pathname} type='album' />
                  )}
                />

                {/* Hash id routes */}
                <Route
                  exact
                  path={USER_ID_PAGE}
                  render={(props) => (
                    <ProfilePage
                      {...props}
                      containerRef={this.props.mainContentRef.current}
                    />
                  )}
                />
                <Route exact path={TRACK_ID_PAGE} component={TrackPage} />
                <Route
                  exact
                  path={PLAYLIST_ID_PAGE}
                  component={CollectionPage}
                />

                {/*
                Define profile page sub-routes before profile page itself.
                The rules for sub-routes would lose in a precedence fight with
                the rule for track page if defined below.
                */}
                <Route
                  exact
                  path={[
                    PROFILE_PAGE_TRACKS,
                    PROFILE_PAGE_ALBUMS,
                    PROFILE_PAGE_PLAYLISTS,
                    PROFILE_PAGE_REPOSTS,
                    PROFILE_PAGE_COLLECTIBLE_DETAILS,
                    PROFILE_PAGE_COLLECTIBLES
                  ]}
                  render={(props) => (
                    <ProfilePage
                      {...props}
                      containerRef={this.props.mainContentRef.current}
                    />
                  )}
                />
                <Route
                  exact
                  path={PROFILE_PAGE_AI_ATTRIBUTED_TRACKS}
                  component={AiAttributedTracksPage}
                />

                <Route exact path={TRACK_PAGE} component={TrackPage} />

                <Route
                  exact
                  path={TRACK_REMIXES_PAGE}
                  render={(props) => (
                    <RemixesPage
                      {...props}
                      containerRef={this.props.mainContentRef.current}
                    />
                  )}
                />

                <MobileRoute
                  exact
                  path={REPOSTING_USERS_ROUTE}
                  isMobile={isMobile}
                  component={RepostsPage}
                />
                <MobileRoute
                  exact
                  path={FAVORITING_USERS_ROUTE}
                  isMobile={isMobile}
                  component={FavoritesPage}
                />
                <MobileRoute
                  exact
                  path={FOLLOWING_USERS_ROUTE}
                  isMobile={isMobile}
                  component={FollowingPage}
                />
                <MobileRoute
                  exact
                  path={FOLLOWERS_USERS_ROUTE}
                  isMobile={isMobile}
                  component={FollowersPage}
                />
                <MobileRoute
                  exact
                  path={SUPPORTING_USERS_ROUTE}
                  isMobile={isMobile}
                  component={SupportingPage}
                />
                <MobileRoute
                  exact
                  path={TOP_SUPPORTERS_USERS_ROUTE}
                  isMobile={isMobile}
                  component={TopSupportersPage}
                />
                <MobileRoute
                  exact
                  path={EMPTY_PAGE}
                  isMobile={isMobile}
                  component={EmptyPage}
                />
                <Route
                  exact
                  path={PROFILE_PAGE}
                  render={(props) => (
                    <ProfilePage
                      {...props}
                      containerRef={this.props.mainContentRef.current}
                    />
                  )}
                />

                <Redirect
                  from={HOME_PAGE}
                  to={{
                    // If we navigated into the dapp from the public site, which has
                    // no access to the ConnectedReactRouter history,
                    // the redirect will actually fire even though the current
                    // pathname is not HOME_PAGE. Double check that it is and if not,
                    // just trigger a react router push to the current pathname
                    pathname:
                      getPathname(this.props.history.location) === HOME_PAGE
                        ? FEED_PAGE
                        : getPathname(this.props.history.location),
                    search: includeSearch(this.props.location.search)
                      ? this.props.location.search
                      : ''
                  }}
                />
              </SwitchComponent>
            </Suspense>
          </div>
          <PlayBarProvider />
          <ClientOnly>
            <Modals />
            <ConnectedMusicConfetti />
          </ClientOnly>

          <RewardClaimedToast />
          {/* Non-mobile */}
          {!isMobile ? <Konami /> : null}
          {!isMobile ? <Visualizer /> : null}
          {!isMobile ? <PinnedTrackConfirmation /> : null}
          {!isMobile ? <DevModeMananger /> : null}
          {/* Mobile-only */}
          {isMobile ? (
            <AppRedirectPopover
              incrementScroll={incrementScroll}
              decrementScroll={decrementScroll}
            />
          ) : null}
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  hasAccount: getHasAccount(state),
  userId: getUserId(state),
  userHandle: getUserHandle(state),
  accountStatus: getAccountStatus(state),
  signOnStatus: getSignOnStatus(state),
  theme: getTheme(state),
  showCookieBanner: getShowCookieBanner(state),
  isChatEnabled: getFeatureEnabled(FeatureFlags.CHAT_ENABLED)
})

const mapDispatchToProps = (dispatch) => ({
  setTheme: (theme) => dispatch(setTheme({ theme })),
  updateRouteOnSignUpCompletion: (route) =>
    dispatch(updateRouteOnSignUpCompletion(route)),
  openSignOn: (signIn = true, page = null, fields = {}) =>
    dispatch(openSignOn(signIn, page, fields)),
  incrementScroll: () => dispatch(incrementScrollCountAction()),
  decrementScroll: () => dispatch(decrementScrollCountAction()),
  recordClickCTABanner: () => {
    dispatch(make(Name.ACCOUNT_HEALTH_CLICK_APP_CTA_BANNER, {}))
  },
  showAppCTAModal: () => {
    dispatch(setAppModalCTAVisibility({ isOpen: true }))
  }
})

const RouterWebPlayer = withRouter(
  connect(mapStateToProps, mapDispatchToProps)(WebPlayer)
)

const MainContentRouterWebPlayer = () => {
  return (
    <MainContentContextProvider>
      <MainContentContext.Consumer>
        {({ mainContentRef }) => (
          <RouterWebPlayer mainContentRef={mainContentRef} />
        )}
      </MainContentContext.Consumer>
    </MainContentContextProvider>
  )
}

export default MainContentRouterWebPlayer
