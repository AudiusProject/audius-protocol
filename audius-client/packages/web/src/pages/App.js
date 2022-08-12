import { lazy, createRef, Component, Suspense } from 'react'

import {
  Client,
  Name,
  SmartCollectionVariant,
  Status,
  Theme,
  StringKeys
} from '@audius/common'
import cn from 'classnames'
import { connect } from 'react-redux'
import { matchPath } from 'react-router'
import { Switch, Route, Redirect, withRouter } from 'react-router-dom'
import semver from 'semver'

import {
  getHasAccount,
  getAccountStatus,
  getUserId,
  getConnectivityFailure,
  getUserHandle
} from 'common/store/account/selectors'
import { getWeb3Error } from 'common/store/backend/selectors'
import { ExploreCollectionsVariant } from 'common/store/pages/explore/types'
import { setTheme } from 'common/store/ui/theme/actions'
import { getTheme } from 'common/store/ui/theme/selectors'
import AppRedirectListener from 'components/app-redirect-popover/AppRedirectListener'
import AppRedirectPopover from 'components/app-redirect-popover/components/AppRedirectPopover'
import MobileDesktopBanner from 'components/banner/CTABanner'
import UpdateAppBanner from 'components/banner/UpdateAppBanner'
import Web3ErrorBanner from 'components/banner/Web3ErrorBanner'
import ConfirmerPreview from 'components/confirmer-preview/ConfirmerPreview'
import CookieBanner from 'components/cookie-banner/CookieBanner'
import { DevModeMananger } from 'components/dev-mode-manager/DevModeManager'
import { BACKGROUND_ELEMENT_ID as HEADER_BACKGROUND_GUTTER_ID } from 'components/header/desktop/Header'
import { HeaderContextConsumer } from 'components/header/mobile/HeaderContextProvider'
import Konami from 'components/konami/Konami'
import Navigator from 'components/nav/Navigator'
import { NotificationPage } from 'components/notification'
import PinnedTrackConfirmation from 'components/pin-track-confirmation/PinTrackConfirmation'
import PlayBarProvider from 'components/play-bar/PlayBarProvider'
import ConnectedReachabilityBar from 'components/reachability-bar/ReachabilityBar'
import { RewardClaimedToast } from 'components/reward-claimed-toast/RewardClaimedToast'
import DesktopRoute from 'components/routes/DesktopRoute'
import MobileRoute from 'components/routes/MobileRoute'
import TrendingGenreSelectionPage from 'components/trending-genre-selection/TrendingGenreSelectionPage'
import AnnouncementPage from 'pages/announcement-page/AnnoucementPage'
import ArtistDashboardPage from 'pages/artist-dashboard-page/ArtistDashboardPage'
import { AudioRewardsPage } from 'pages/audio-rewards-page/AudioRewardsPage'
import CheckPage from 'pages/check-page/CheckPage'
import CollectionPage from 'pages/collection-page/CollectionPage'
import EmptyPage from 'pages/empty-page/EmptyPage'
import ExplorePage from 'pages/explore-page/ExplorePage'
import FavoritesPage from 'pages/favorites-page/FavoritesPage'
import FeedPage from 'pages/feed-page/FeedPage'
import HistoryPage from 'pages/history-page/HistoryPage'
import NotFoundPage from 'pages/not-found-page/NotFoundPage'
import NotificationUsersPage from 'pages/notification-users-page/NotificationUsersPage'
import ProfilePage from 'pages/profile-page/ProfilePage'
import RemixesPage from 'pages/remixes-page/RemixesPage'
import RepostsPage from 'pages/reposts-page/RepostsPage'
import RequiresUpdate from 'pages/requires-update/RequiresUpdate'
import SavedPage from 'pages/saved-page/SavedPage'
import SearchPage from 'pages/search-page/SearchPage'
import {
  openSignOn,
  updateRouteOnCompletion as updateRouteOnSignUpCompletion
} from 'pages/sign-on/store/actions'
import { getStatus as getSignOnStatus } from 'pages/sign-on/store/selectors'
import { Pages as SignOnPages } from 'pages/sign-on/store/types'
import TrackPage from 'pages/track-page/TrackPage'
import TrendingPage from 'pages/trending-page/TrendingPage'
import TrendingPlaylistsPage from 'pages/trending-playlists/TrendingPlaylistPage'
import TrendingUndergroundPage from 'pages/trending-underground/TrendingUndergroundPage'
import UploadType from 'pages/upload-page/components/uploadType'
import Visualizer from 'pages/visualizer/Visualizer'
import { ThemeChangeMessage } from 'services/native-mobile-interface/theme'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { initializeSentry } from 'services/sentry'
import { make } from 'store/analytics/actions'
import { setVisibility as setAppModalCTAVisibility } from 'store/application/ui/app-cta-modal/slice'
import { getShowCookieBanner } from 'store/application/ui/cookieBanner/selectors'
import {
  incrementScrollCount as incrementScrollCountAction,
  decrementScrollCount as decrementScrollCountAction
} from 'store/application/ui/scrollLock/actions'
import { isMobile, getClient } from 'utils/clientUtil'
import lazyWithPreload from 'utils/lazyWithPreload'
import 'utils/redirect'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  NOTIFICATION_PAGE,
  ANNOUNCEMENT_PAGE,
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
  HISTORY_PAGE,
  DASHBOARD_PAGE,
  AUDIO_PAGE,
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
  SIGN_IN_PAGE,
  SIGN_UP_PAGE,
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
  publicSiteRoutes
} from 'utils/route'
import { getTheme as getSystemTheme } from 'utils/theme/theme'

import AnimatedSwitch from '../components/animated-switch/AnimatedSwitch'
import DiscoveryNodeSelection from '../components/discovery-node-selection/DiscoveryNodeSelection'
import TopLevelPage from '../components/nav/mobile/TopLevelPage'
import Notice from '../components/notice/Notice'

import styles from './App.module.css'
import { CollectiblesPlaylistPage } from './collectibles-playlist-page'
import { DeactivateAccountPage } from './deactivate-account-page/DeactivateAccountPage'
import ExploreCollectionsPage from './explore-page/ExploreCollectionsPage'
import FollowersPage from './followers-page/FollowersPage'
import FollowingPage from './following-page/FollowingPage'
import SettingsPage from './settings-page/SettingsPage'
import { SubPage } from './settings-page/components/mobile/SettingsPage'
import SmartCollectionPage from './smart-collection/SmartCollectionPage'
import SupportingPage from './supporting-page/SupportingPage'
import TopSupportersPage from './top-supporters-page/TopSupportersPage'

const MOBILE_BANNER_LOCAL_STORAGE_KEY = 'dismissMobileAppBanner'

const SignOn = lazy(() => import('pages/sign-on/SignOn'))

const UploadPage = lazyWithPreload(
  () => import('pages/upload-page/UploadPage'),
  0
)
const Modals = lazyWithPreload(() => import('./modals/Modals'), 0)
const ConnectedMusicConfetti = lazyWithPreload(
  () => import('components/music-confetti/ConnectedMusicConfetti'),
  0
)

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
export const MAIN_CONTENT_ID = 'mainContent'

const includeSearch = (search) => {
  return search.includes('oauth_token') || search.includes('code')
}

initializeSentry()

class App extends Component {
  state = {
    mainContent: null,

    showCTABanner: false,
    showWeb3ErrorBanner: null,

    showUpdateAppBanner: false,
    showWebUpdateBanner: false,
    showRequiresUpdate: false,
    showRequiresWebUpdate: false,
    isUpdating: false,

    initialPage: true,
    entryRoute: getPathname(this.props.history.location),
    currentRoute: getPathname(this.props.history.location)
  }

  ipc = null

  headerGutterRef = createRef()

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
          currentRoute: getPathname(location)
        })
      }
    )

    if (
      !window.localStorage.getItem(MOBILE_BANNER_LOCAL_STORAGE_KEY) &&
      client === Client.DESKTOP
    ) {
      this.setState({ showCTABanner: true })
    }

    if (client === Client.ELECTRON) {
      this.ipc = window.require('electron').ipcRenderer
      // We downloaded an update, the user can safely restart
      this.ipc.on('updateDownloaded', (event, arg) => {
        console.info('updateDownload', event, arg)
        this.setState({ showUpdateAppBanner: true })
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
          this.setState({ showWebUpdate: true })
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
        if (!NATIVE_MOBILE) {
          this.props.openSignOn(true, SignOnPages.SIGNIN)
        }
        this.props.updateRouteOnSignUpCompletion(this.state.entryRoute)
      } else {
        this.pushWithToken(TRENDING_PAGE)
      }
    }

    if (this.props.web3Error && this.state.showWeb3ErrorBanner === null) {
      this.setState({ showWeb3ErrorBanner: true })
    }

    // Once the user is loaded, we can mark the page as ready for UI
    // Alternatively, if the page is the signup page, say we're ready without a user
    // This is necessary for the AppRedirectPopover to load
    if (
      (prevProps.accountStatus === Status.LOADING &&
        this.props.accountStatus !== Status.LOADING) ||
      matchPath(getPathname(this.props.location), {
        path: SIGN_UP_PAGE,
        exact: true
      })
    ) {
      // Let the UI flush
      setImmediate(this.props.setReady)
    }

    if (
      prevProps.firstLoadConnectivityFailure !==
      this.props.firstLoadConnectivityFailure
    ) {
      this.props.setConnectivityFailure(this.props.firstLoadConnectivityFailure)
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

    // If we're on native mobile, dispatch
    // a message to the native layer so it can properly
    // set it's status bar color.
    if (NATIVE_MOBILE) {
      const theme = this.props.theme || Theme.DEFAULT
      const themeMessage = new ThemeChangeMessage(theme)
      themeMessage.send()
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

  dismissCTABanner = () => {
    this.setState({ showCTABanner: false })
    window.localStorage.setItem(MOBILE_BANNER_LOCAL_STORAGE_KEY, 'true')
  }

  acceptUpdateApp = () => {
    if (this.state.showUpdateAppBanner) {
      this.dismissUpdateAppBanner()
    }
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

  dismissUpdateAppBanner = () => {
    this.setState({ showUpdateAppBanner: false })
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

  dismissWeb3ErrorBanner = () => {
    this.setState({ showWeb3ErrorBanner: false })
  }

  render() {
    const {
      theme,
      isReady,
      incrementScroll,
      decrementScroll,
      shouldShowPopover,
      userHandle
    } = this.props

    const {
      showCTABanner,
      showUpdateAppBanner,
      showWebUpdate,
      showWeb3ErrorBanner,
      isUpdating,
      showRequiresUpdate,
      showRequiresWebUpdate,
      initialPage
    } = this.state
    const client = getClient()
    const isMobileClient = client === Client.MOBILE

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

    const showBanner =
      showCTABanner || showUpdateAppBanner || showWeb3ErrorBanner
    if (this.headerGutterRef.current) {
      if (showBanner) {
        this.headerGutterRef.current.classList.add(styles.bannerMargin)
      } else {
        this.headerGutterRef.current.classList.remove(styles.bannerMargin)
      }
    } else {
      this.headerGutterRef.current = document.getElementById(
        HEADER_BACKGROUND_GUTTER_ID
      )
    }

    const SwitchComponent = isMobile() ? AnimatedSwitch : Switch

    return (
      <div className={cn(styles.app, { [styles.mobileApp]: isMobileClient })}>
        {showCTABanner ? (
          <MobileDesktopBanner
            onClose={this.dismissCTABanner}
            onAccept={this.showDownloadAppModal}
          />
        ) : null}
        {showUpdateAppBanner ? (
          <UpdateAppBanner
            onClose={this.dismissUpdateAppBanner}
            onAccept={this.acceptUpdateApp}
          />
        ) : null}
        {showWeb3ErrorBanner ? (
          <Web3ErrorBanner
            alert
            isElectron={client === Client.ELECTRON}
            onClose={this.dismissWeb3ErrorBanner}
          />
        ) : null}
        {showWebUpdate ? (
          <UpdateAppBanner
            onAccept={this.acceptWebUpdate}
            onClose={this.dismissUpdateWebAppBanner}
          />
        ) : null}
        {this.props.showCookieBanner ? <CookieBanner /> : null}
        <Notice shouldPadTop={showBanner} />
        <Navigator
          className={cn({
            [styles.bannerMargin]: showBanner && client !== Client.ELECTRON
          })}
        />
        <div className={styles.draggableArea} />
        <div
          ref={this.props.mainContentRef}
          id={MAIN_CONTENT_ID}
          role='main'
          className={cn(styles.mainContentWrapper, {
            [styles.bannerMargin]: showBanner,
            [styles.mainContentWrapperMobile]: isMobileClient
          })}
        >
          {isMobileClient && <TopLevelPage />}
          {isMobileClient && <HeaderContextConsumer />}

          <Suspense fallback={null}>
            <SwitchComponent isInitialPage={initialPage} handle={userHandle}>
              {publicSiteRoutes.map((route) => (
                // Redirect all public site routes to the corresponding pathname.
                // This is necessary first because otherwise pathnames like
                // legal/privacy-policy will match the track route.
                <Redirect
                  key={route}
                  from={route}
                  to={{ pathname: getPathname() }}
                />
              ))}

              <Route
                exact
                path={SIGN_IN_PAGE}
                isMobile={isMobileClient}
                render={() => <SignOn signIn initialPage={initialPage} />}
              />
              <Route
                exact
                path={SIGN_UP_PAGE}
                isMobile={isMobileClient}
                render={() => (
                  <SignOn signIn={false} initialPage={initialPage} />
                )}
              />
              <Route
                exact
                path={FEED_PAGE}
                isMobile={isMobileClient}
                render={() => (
                  <FeedPage containerRef={this.props.mainContentRef.current} />
                )}
              />
              <Route
                exact
                path={NOTIFICATION_USERS_PAGE}
                isMobile={isMobileClient}
                component={NotificationUsersPage}
              />
              <Route
                exact
                path={ANNOUNCEMENT_PAGE}
                isMobile={isMobileClient}
                component={AnnouncementPage}
              />
              <Route
                exact
                path={NOTIFICATION_PAGE}
                isMobile={isMobileClient}
                component={NotificationPage}
              />
              <MobileRoute
                exact
                path={TRENDING_GENRES}
                isMobile={isMobileClient}
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
              <Route exact path={EXPLORE_PAGE} render={() => <ExplorePage />} />
              <Route
                exact
                path={AUDIO_NFT_PLAYLIST_PAGE}
                render={() => <CollectiblesPlaylistPage />}
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
                isMobile={isMobileClient}
                render={() => <UploadPage uploadType={UploadType.ALBUM} />}
              />
              <DesktopRoute
                path={UPLOAD_PLAYLIST_PAGE}
                isMobile={isMobileClient}
                render={() => <UploadPage uploadType={UploadType.PLAYLIST} />}
              />
              <DesktopRoute
                path={UPLOAD_PAGE}
                isMobile={isMobileClient}
                component={UploadPage}
              />

              <Route exact path={SAVED_PAGE} component={SavedPage} />
              <Route exact path={HISTORY_PAGE} component={HistoryPage} />
              <DesktopRoute
                exact
                path={DASHBOARD_PAGE}
                isMobile={isMobileClient}
                component={ArtistDashboardPage}
              />
              <Route
                exact
                path={AUDIO_PAGE}
                isMobile={isMobileClient}
                component={AudioRewardsPage}
              />
              <Route
                exact
                path={DEACTIVATE_PAGE}
                isMobile={isMobileClient}
                component={DeactivateAccountPage}
              />
              <Route
                exact
                path={SETTINGS_PAGE}
                isMobile={isMobileClient}
                component={SettingsPage}
              />
              <Route exact path={CHECK_PAGE} component={CheckPage} />
              <MobileRoute
                exact
                path={ACCOUNT_SETTINGS_PAGE}
                isMobile={isMobileClient}
                render={() => <SettingsPage subPage={SubPage.ACCOUNT} />}
              />
              <MobileRoute
                exact
                path={ACCOUNT_VERIFICATION_SETTINGS_PAGE}
                isMobile={isMobileClient}
                render={() => <SettingsPage subPage={SubPage.VERIFICATION} />}
              />
              <MobileRoute
                exact
                path={CHANGE_PASSWORD_SETTINGS_PAGE}
                isMobile={isMobileClient}
                render={() => (
                  <SettingsPage subPage={SubPage.CHANGE_PASSWORD} />
                )}
              />
              <MobileRoute
                exact
                path={NOTIFICATION_SETTINGS_PAGE}
                isMobile={isMobileClient}
                render={() => <SettingsPage subPage={SubPage.NOTIFICATIONS} />}
              />
              <MobileRoute
                exact
                path={ABOUT_SETTINGS_PAGE}
                isMobile={isMobileClient}
                render={() => <SettingsPage subPage={SubPage.ABOUT} />}
              />

              <Route path={APP_REDIRECT} component={AppRedirectListener} />
              <Route exact path={NOT_FOUND_PAGE} component={NotFoundPage} />

              <Route
                exact
                path={PLAYLIST_PAGE}
                render={() => <CollectionPage type='playlist' />}
              />
              <Route
                exact
                path={ALBUM_PAGE}
                render={() => <CollectionPage type='album' />}
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
              <Route exact path={PLAYLIST_ID_PAGE} component={CollectionPage} />

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
                isMobile={isMobileClient}
                component={RepostsPage}
              />
              <MobileRoute
                exact
                path={FAVORITING_USERS_ROUTE}
                isMobile={isMobileClient}
                component={FavoritesPage}
              />
              <MobileRoute
                exact
                path={FOLLOWING_USERS_ROUTE}
                isMobile={isMobileClient}
                component={FollowingPage}
              />
              <MobileRoute
                exact
                path={FOLLOWERS_USERS_ROUTE}
                isMobile={isMobileClient}
                component={FollowersPage}
              />
              <MobileRoute
                exact
                path={SUPPORTING_USERS_ROUTE}
                isMobile={isMobileClient}
                component={SupportingPage}
              />
              <MobileRoute
                exact
                path={TOP_SUPPORTERS_USERS_ROUTE}
                isMobile={isMobileClient}
                component={TopSupportersPage}
              />
              <MobileRoute
                exact
                path={EMPTY_PAGE}
                isMobile={isMobileClient}
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
                    getPathname() === HOME_PAGE ? FEED_PAGE : getPathname(),
                  search: includeSearch(this.props.location.search)
                    ? this.props.location.search
                    : ''
                }}
              />
            </SwitchComponent>
          </Suspense>
        </div>
        <PlayBarProvider />

        <Suspense fallback={null}>
          <Modals />
        </Suspense>

        {
          <Suspense fallback={null}>
            <ConnectedMusicConfetti />
          </Suspense>
        }
        {
          <Suspense fallback={null}>
            <RewardClaimedToast />
          </Suspense>
        }

        {/* Non-mobile */}
        {!isMobileClient && <Konami />}
        {!isMobileClient && <ConfirmerPreview />}
        {!isMobileClient && <DiscoveryNodeSelection />}
        {!isMobileClient && <Visualizer />}
        {!isMobileClient && <PinnedTrackConfirmation />}
        {!isMobileClient && <DevModeMananger />}

        {/* Mobile-only */}
        {isMobileClient && <ConnectedReachabilityBar />}

        {shouldShowPopover && isMobileClient && !NATIVE_MOBILE && (
          <AppRedirectPopover
            enablePopover={isReady}
            incrementScroll={incrementScroll}
            decrementScroll={decrementScroll}
          />
        )}
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
  web3Error: getWeb3Error(state),
  theme: getTheme(state),
  showCookieBanner: getShowCookieBanner(state),
  firstLoadConnectivityFailure: getConnectivityFailure(state)
})

const mapDispatchToProps = (dispatch) => ({
  setTheme: (theme) => dispatch(setTheme(theme)),
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App))
