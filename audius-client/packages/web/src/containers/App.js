import React, { Component, Suspense } from 'react'
import { connect } from 'react-redux'
import { Switch, Route, Redirect, withRouter } from 'react-router-dom'
import { matchPath } from 'react-router'
import cn from 'classnames'
import * as Sentry from '@sentry/browser'
import semver from 'semver'
import { make } from 'store/analytics/actions'
import { Name } from 'services/analytics'

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
  EXPLORE_TOP_PLAYLISTS_PAGE,
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
  ERROR_PAGE,
  REPOSTING_USERS_ROUTE,
  FAVORITING_USERS_ROUTE,
  ACCOUNT_SETTINGS_PAGE,
  ACCOUNT_VERIFICATION_SETTINGS_PAGE,
  NOTIFICATION_SETTINGS_PAGE,
  ABOUT_SETTINGS_PAGE,
  FOLLOWING_USERS_ROUTE,
  FOLLOWERS_USERS_ROUTE,
  TRENDING_GENRES,
  APP_REDIRECT,
  TRACK_ID_PAGE,
  USER_ID_PAGE,
  PLAYLIST_ID_PAGE
} from 'utils/route'
import 'utils/redirect'
import { isMobile, getClient } from 'utils/clientUtil'
import { Status } from 'store/types'
import {
  getHasAccount,
  getAccountStatus,
  getUserId,
  getConnectivityFailure,
  getUserHandle
} from 'store/account/selectors'
import { getWeb3Error } from 'store/backend/selectors'
import { getTheme as getSystemTheme } from 'utils/theme/theme'

import CookieBanner from 'containers/cookie-banner/CookieBanner'
import MobileDesktopBanner from 'components/banner/CTABanner'
import UpdateAppBanner from 'components/banner/UpdateAppBanner'
import Web3ErrorBanner from 'components/banner/Web3ErrorBanner'

import PinnedTrackConfirmation from 'containers/pin-track-confirmation/PinTrackConfirmation'
import SomethingWrong from 'containers/something-wrong/SomethingWrong'
import RequiresUpdate from 'containers/requires-update/RequiresUpdate'
import PlayBarProvider from 'containers/play-bar/PlayBarProvider'
import UploadType from 'containers/upload-page/components/uploadType'
import Visualizer from 'containers/visualizer/Visualizer'
import { Pages as SignOnPages } from 'containers/sign-on/store/types'
import {
  incrementScrollCount as incrementScrollCountAction,
  decrementScrollCount as decrementScrollCountAction
} from 'store/application/ui/scrollLock/actions'

import styles from './App.module.css'
import Navigator from 'containers/nav/Navigator'
import DesktopRoute from 'components/routes/DesktopRoute'
import MobileRoute from 'components/routes/MobileRoute'
import Client from 'models/Client'
import Theme from 'models/Theme'
import { getShowCookieBanner } from 'store/application/ui/cookieBanner/selectors'
import { getStatus as getSignOnStatus } from 'containers/sign-on/store/selectors'
import {
  openSignOn,
  updateRouteOnCompletion as updateRouteOnSignUpCompletion
} from 'containers/sign-on/store/actions'
import { setTheme } from 'store/application/ui/theme/actions'
import lazyWithPreload from 'utils/lazyWithPreload'
import { initializeSentry } from 'services/sentry'
import { getTheme } from 'store/application/ui/theme/selectors'
import { BACKGROUND_ELEMENT_ID as HEADER_BACKGROUND_GUTTER_ID } from 'components/general/header/desktop/Header'
import { HeaderContextConsumer } from 'components/general/header/mobile/HeaderContextProvider'
import { SubPage } from './settings-page/components/mobile/SettingsPage'
import { clearAll } from 'utils/persistentCache'
import { SmartCollectionVariant } from './smart-collection/types'
import { ExploreCollectionsVariant } from './explore-page/store/types'
import { setVisibility as setAppModalCTAVisibility } from 'store/application/ui/app-cta-modal/slice'

import AnimatedSwitch from './animated-switch/AnimatedSwitch'

import Discover from 'containers/discover-page/DiscoverPage'
import CollectionPage from 'containers/collection-page/CollectionPage'
import TrackPage from 'containers/track-page/TrackPage'
import ProfilePage from 'containers/profile-page/ProfilePage'
import RemixesPage from 'containers/remixes-page/RemixesPage'

import NotificationPage from 'containers/notification/NotificationPage'
import AnnouncementPage from 'containers/announcement-page/AnnoucementPage'
import NotFoundPage from 'containers/not-found-page/NotFoundPage'
import ArtistDashboardPage from 'containers/artist-dashboard-page/ArtistDashboardPage'
import AudioRewardsPage from 'containers/audio-rewards-page/AudioRewardsPage'
import SearchPage from 'containers/search-page/SearchPage'
import HistoryPage from 'containers/history-page/HistoryPage'
import SavedPage from 'containers/saved-page/SavedPage'
import ExplorePage from 'containers/explore-page/ExplorePage'
import RepostsPage from 'containers/reposts-page/RepostsPage'
import FavoritesPage from 'containers/favorites-page/FavoritesPage'
import NotificationUsersPage from 'containers/notification-users-page/NotificationUsersPage'
import FollowingPage from './following-page/FollowingPage'
import FollowersPage from './followers-page/FollowersPage'
import TopLevelPage from './nav/mobile/TopLevelPage'
import TrendingGenreSelectionPage from 'containers/trending-genre-selection/TrendingGenreSelectionPage'
import ConnectedReachabilityBar from 'containers/reachability-bar/ReachabilityBar'
import Konami from 'containers/konami/Konami'
import AppRedirectPopover from 'containers/app-redirect-popover/components/AppRedirectPopover'
import AppRedirectListener from 'containers/app-redirect-popover/AppRedirectListener'
import SmartCollectionPage from './smart-collection/SmartCollectionPage'
import ExploreCollectionsPage from './explore-page/ExploreCollectionsPage'
import ConfirmerPreview from 'containers/confirmer-preview/ConfirmerPreview'
import Notice from './notice/Notice'
import SignOn from 'containers/sign-on/SignOn'
import EnablePushNotificationsDrawer from './enable-push-notifications-drawer/EnablePushNotificationsDrawer'
import { ThemeChangeMessage } from 'services/native-mobile-interface/theme'

const MOBILE_BANNER_LOCAL_STORAGE_KEY = 'dismissMobileAppBanner'

const SettingsPage = lazyWithPreload(
  () => import('containers/settings-page/SettingsPage'),
  0
)
const UploadPage = lazyWithPreload(
  () => import('containers/upload-page/UploadPage'),
  0
)
const Modals = lazyWithPreload(() => import('./Modals'), 0)
const ConnectedMusicConfetti = lazyWithPreload(
  () => import('containers/music-confetti/ConnectedMusicConfetti'),
  0
)

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
export const MAIN_CONTENT_ID = 'mainContent'

export const includeSearch = search => {
  return search.includes('oauth_token') || search.includes('code')
}

initializeSentry()

class App extends Component {
  state = {
    didError: false,
    mainContent: null,

    showCTABanner: false,
    showWeb3ErrorBanner: null,

    showUpdateAppBanner: false,
    showRequiresUpdate: false,
    isUpdating: false,

    initialPage: true,
    entryRoute: this.props.history.location.pathname,
    lastRoute: null,
    currentRoute: this.props.history.location.pathname
  }

  ipc = null

  headerGutterRef = React.createRef()

  scrollToTop = () => {
    this.state.mainContent &&
      this.state.mainContent.scrollTo &&
      this.state.mainContent.scrollTo({ top: 0 })
  }

  componentDidMount() {
    const client = getClient()

    this.removeHistoryEventListener = this.props.history.listen(
      (location, action) => {
        this.scrollToTop()
        this.setState(prevState => ({
          initialPage: false,
          lastRoute: prevState.currentRoute,
          currentRoute: location.pathname
        }))
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

      // There is an update available, the user should update if it's
      // more than a minor version.
      this.ipc.on('updateAvailable', (event, arg) => {
        console.info('updateAvailable', event, arg)
        const { version, currentVersion } = arg
        if (semver.minor(currentVersion) < semver.minor(version)) {
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
            popup: popup,
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
            set: locationHref => {
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
      authenticatedRoutes.some(route => {
        const match = matchPath(this.props.location.pathname, {
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

    if (
      prevProps.accountStatus === Status.LOADING &&
      this.props.accountStatus !== Status.LOADING
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

  pushWithToken = route => {
    const search = this.props.location.search
    // Twitter and instagram search params
    if (includeSearch(search)) {
      this.props.history.push(`${route}${search}`)
    } else {
      this.props.history.push(route)
    }
  }

  setContainerRef = r => {
    this.setState({ mainContent: r })
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

  dismissUpdateAppBanner = () => {
    this.setState({ showUpdateAppBanner: false })
  }

  showDownloadAppModal = () => {
    this.props.recordClickCTABanner()
    this.props.showAppCTAModal()
  }

  dismissWeb3ErrorBanner = () => {
    this.setState({ showWeb3ErrorBanner: false })
  }

  static getDerivedStateFromError(_) {
    return { didError: true }
  }

  componentDidCatch(error, errorInfo) {
    try {
      Sentry.withScope(scope => {
        scope.setExtras(errorInfo)
        Sentry.captureException(error)
      })
    } catch (error) {
      console.error(error.message)
    }
    // Dump the persistent cache on error, just in case that is causing some
    // un-recoverable state.
    clearAll()
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
      didError,
      showCTABanner,
      showUpdateAppBanner,
      showWeb3ErrorBanner,
      isUpdating,
      showRequiresUpdate,
      initialPage,
      lastRoute
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
    if (didError || this.props.location.pathname === ERROR_PAGE)
      return <SomethingWrong lastRoute={lastRoute} />

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
        {this.props.showCookieBanner ? <CookieBanner /> : null}
        <Notice shouldPadTop={showBanner} />
        <Navigator
          className={cn({
            [styles.bannerMargin]: showBanner && client !== Client.ELECTRON
          })}
        />
        <div className={styles.draggableArea} />
        <div
          ref={this.setContainerRef}
          id={MAIN_CONTENT_ID}
          className={cn(styles.mainContentWrapper, {
            [styles.bannerMargin]: showBanner,
            [styles.mainContentWrapperMobile]: isMobileClient
          })}
        >
          {isMobileClient && <TopLevelPage />}
          {isMobileClient && <HeaderContextConsumer />}
          <Suspense fallback={null}>
            <SwitchComponent isInitialPage={initialPage} handle={userHandle}>
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
                  <Discover feedIsMain containerRef={this.state.mainContent} />
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
                  <Discover
                    feedIsMain={false}
                    containerRef={this.state.mainContent}
                  />
                )}
              />

              <Route exact path={EXPLORE_PAGE} render={() => <ExplorePage />} />
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
                path={EXPLORE_TOP_PLAYLISTS_PAGE}
                render={() => (
                  <ExploreCollectionsPage
                    variant={ExploreCollectionsVariant.TOP_PLAYLISTS}
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
                render={props => (
                  <SearchPage
                    {...props}
                    scrollToTop={this.scrollToTop}
                    containerRef={this.state.mainContent}
                  />
                )}
              />
              <Route
                path={SEARCH_PAGE}
                render={props => (
                  <SearchPage
                    {...props}
                    scrollToTop={this.scrollToTop}
                    containerRef={this.state.mainContent}
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
              <DesktopRoute
                exact
                path={AUDIO_PAGE}
                isMobile={isMobileClient}
                component={AudioRewardsPage}
              />
              <Route
                exact
                path={SETTINGS_PAGE}
                isMobile={isMobileClient}
                component={SettingsPage}
              />
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
                render={props => (
                  <ProfilePage
                    {...props}
                    containerRef={this.state.mainContent}
                  />
                )}
              />
              <Route exact path={TRACK_ID_PAGE} component={TrackPage} />
              <Route exact path={PLAYLIST_ID_PAGE} component={CollectionPage} />

              <Route exact path={TRACK_PAGE} component={TrackPage} />

              <Route
                exact
                path={TRACK_REMIXES_PAGE}
                render={props => (
                  <RemixesPage
                    {...props}
                    containerRef={this.state.mainContent}
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

              <Route
                exact
                path={PROFILE_PAGE}
                render={props => (
                  <ProfilePage
                    {...props}
                    containerRef={this.state.mainContent}
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
                    window.location.pathname === HOME_PAGE
                      ? FEED_PAGE
                      : window.location.pathname,
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

        {/* Non-mobile */}
        {!isMobileClient && <Konami />}
        {!isMobileClient && <ConfirmerPreview />}
        {!isMobileClient && <Visualizer />}
        {!isMobileClient && <PinnedTrackConfirmation />}

        {/* Mobile-only */}
        {isMobileClient && <ConnectedReachabilityBar />}
        {/* Native Mobile-only */}
        {isMobileClient && NATIVE_MOBILE && <EnablePushNotificationsDrawer />}

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

const mapStateToProps = state => ({
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

const mapDispatchToProps = dispatch => ({
  setTheme: theme => dispatch(setTheme(theme)),
  updateRouteOnSignUpCompletion: route =>
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
