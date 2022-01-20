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
import { ChallengeRewardsDrawerProvider } from 'app/components/challenge-rewards-drawer/ChallengeRewardsDrawerProvider'
import CollectibleDetailsDrawer from 'app/components/collectible-details-drawer'
import ConnectWalletsDrawer from 'app/components/connect-wallets-drawer'
import { DeactivateAccountConfirmationDrawer } from 'app/components/deactivate-account-confirmation-drawer/DeactivateAccountConfirmationDrawer'
import DownloadTrackProgressDrawer from 'app/components/download-track-progress-drawer'
import { EditCollectiblesDrawer } from 'app/components/edit-collectibles-drawer'
import EnablePushNotificationsDrawer from 'app/components/enable-push-notifications-drawer'
import HCaptcha from 'app/components/hcaptcha'
import MobileUploadDrawer from 'app/components/mobile-upload-drawer'
import NavigationContainer from 'app/components/navigation-container'
import Notifications from 'app/components/notifications/Notifications'
import OAuth from 'app/components/oauth/OAuth'
import OverflowMenuDrawer from 'app/components/overflow-menu-drawer'
import Search from 'app/components/search/Search'
import { ShareDrawer } from 'app/components/share-drawer'
import ShareToTiktokDrawer from 'app/components/share-to-tiktok-drawer'
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
import { WebAppManager } from './WebAppManager'
import { CognitoDrawer } from './components/cognito-drawer/CognitoDrawer'
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
      <EditCollectiblesDrawer />
      <OverflowMenuDrawer />
      <DeactivateAccountConfirmationDrawer />
      <DownloadTrackProgressDrawer />
      <TransferAudioMobileDrawer />
      <TrendingRewardsDrawer />
      <ApiRewardsDrawer />
      <ShareToTiktokDrawer />
      <ChallengeRewardsDrawerProvider />
      <CognitoDrawer />
      <ShareDrawer />
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
                  <WebAppManager webApp={<WebApp webRef={webRef} />}>
                    <GoogleCast webRef={webRef} />
                    <AppNavigator />
                    <Search />
                    <Notifications webRef={webRef} />
                    <Drawers />
                    <Modals />
                    <Audio webRef={webRef} />
                    <OAuth webRef={webRef} />
                    <Airplay webRef={webRef} />
                  </WebAppManager>
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
