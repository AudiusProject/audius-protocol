import React, { useRef, useEffect } from 'react'

import * as Sentry from '@sentry/react-native'
import { Platform } from 'react-native'
import Config from 'react-native-config'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import { Provider } from 'react-redux'

import ApiRewardsDrawer from 'app/components/api-rewards-drawer/ApiRewardsDrawer'
import AppNavigator from 'app/components/app-navigator/AppNavigator'
// import AudioBreakdownDrawer from 'app/components/audio-breakdown-drawer'
import Audio from 'app/components/audio/Audio'
import GoogleCast from 'app/components/audio/GoogleCast'
import CollectibleDetailsDrawer from 'app/components/collectible-details-drawer'
import ConnectWalletsDrawer from 'app/components/connect-wallets-drawer'
import { DeactivateAccountConfirmationDrawer } from 'app/components/deactivate-account-confirmation-drawer/DeactivateAccountConfirmationDrawer'
import DownloadTrackProgressDrawer from 'app/components/download-track-progress-drawer'
import EnablePushNotificationsDrawer from 'app/components/enable-push-notifications-drawer'
import HCaptcha from 'app/components/hcaptcha'
import MobileUploadDrawer from 'app/components/mobile-upload-drawer'
import NavigationContainer from 'app/components/navigation-container'
import Notifications from 'app/components/notifications/Notifications'
import OAuth from 'app/components/oauth/OAuth'
import OverflowMenuDrawer from 'app/components/overflow-menu-drawer'
import Search from 'app/components/search/Search'
import { ToastContextProvider } from 'app/components/toast/ToastContext'
import TransferAudioMobileDrawer from 'app/components/transfer-audio-mobile-drawer'
import TrendingRewardsDrawer from 'app/components/trending-rewards-drawer'
import WebApp from 'app/components/web/WebApp'
import { WebRefContextProvider } from 'app/components/web/WebRef'
import useConnectivity from 'app/components/web/useConnectivity'
import { incrementSessionCount } from 'app/hooks/useSessionCount'
import PushNotifications from 'app/notifications'
import createStore from 'app/store'
import { setup as setupAnalytics } from 'app/utils/analytics'

import ErrorBoundary from './ErrorBoundary'
import { ThemeContextProvider } from './components/theme/ThemeContext'

Sentry.init({
  dsn: Config.SENTRY_DSN
})

const store = createStore()
export const dispatch = store.dispatch

const Airplay = Platform.select({
  ios: () => require('./components/audio/Airplay').default,
  android: () => () => null
})?.()

// Increment the session count when the App.tsx code is first run
incrementSessionCount()

const Drawers = () => {
  return (
    <>
      <MobileUploadDrawer />
      <EnablePushNotificationsDrawer />
      <CollectibleDetailsDrawer />
      <ConnectWalletsDrawer />
      <OverflowMenuDrawer />
      <DeactivateAccountConfirmationDrawer />
      <DownloadTrackProgressDrawer />
      <TransferAudioMobileDrawer />
      <TrendingRewardsDrawer />
      <ApiRewardsDrawer />
      {/* Disable the audio breakdown drawer until we get
      the feature flags to work for native mobile */}
      {/* <AudioBreakdownDrawer /> */}
    </>
  )
}

const Modals = () => {
  return (
    <>
      <HCaptcha />
    </>
  )
}

const App = () => {
  // Track the web view as a top-level ref so that any children can use it
  // to send messages to the dapp
  const webRef = useRef<WebView>(null)

  // Broadcast connectivity to the wrapped dapp
  useConnectivity({ webRef })

  // Configure push notifications so that it has access to the web view
  // and can message pass to it
  useEffect(() => {
    PushNotifications.setWebRef(webRef)
  }, [webRef])

  useEffect(() => {
    setupAnalytics()
  }, [])

  return (
    <SafeAreaProvider>
      <ThemeContextProvider>
        <ToastContextProvider>
          <ErrorBoundary>
            <NavigationContainer>
              <Provider store={store}>
                <WebRefContextProvider>
                  <GoogleCast webRef={webRef} />
                  <WebApp webRef={webRef} />
                  {/*
                Note: it is very important that components are rendered after WebApp.
                On Android, regardless of position: absolute, WebApp will steal all of
                touch targets and onPress will not work.
              */}
                  <AppNavigator />
                  {/*
                Commenting out NowPlayingDrawer until all drawers and overlays are migrated to RN
              */}
                  <Search />
                  <Notifications webRef={webRef} />
                  <Drawers />
                  <Modals />
                  <Audio webRef={webRef} />
                  <OAuth webRef={webRef} />
                  <Airplay webRef={webRef} />
                </WebRefContextProvider>
              </Provider>
            </NavigationContainer>
          </ErrorBoundary>
        </ToastContextProvider>
      </ThemeContextProvider>
    </SafeAreaProvider>
  )
}

export default Sentry.wrap(App)
