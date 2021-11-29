import React, { useRef, useEffect } from 'react'

import { PortalProvider } from '@gorhom/portal'
import { Platform } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import { Provider } from 'react-redux'

import Audio from 'app/components/audio/Audio'
import GoogleCast from 'app/components/audio/GoogleCast'
// import BottomBar from 'app/components/bottom-bar'
import CollectibleDetailsDrawer from 'app/components/collectible-details-drawer'
import EnablePushNotificationsDrawer from 'app/components/enable-push-notifications-drawer'
import HCaptcha from 'app/components/hcaptcha'
import MobileUploadDrawer from 'app/components/mobile-upload-drawer'
import Notifications from 'app/components/notifications/Notifications'
import OAuth from 'app/components/oauth/OAuth'
import OverflowMenuDrawer from 'app/components/overflow-menu-drawer'
import Search from 'app/components/search/Search'
import SignOnNav from 'app/components/signon/NavigationStack'
import TransferAudioMobileDrawer from 'app/components/transfer-audio-mobile-drawer'
import WebApp from 'app/components/web/WebApp'
import { WebRefContextProvider } from 'app/components/web/WebRef'
import useConnectivity from 'app/components/web/useConnectivity'
import { incrementSessionCount } from 'app/hooks/useSessionCount'
import PushNotifications from 'app/notifications'
import createStore from 'app/store'
import { setup as setupAnalytics } from 'app/utils/analytics'

import { DeactivateAccountConfirmationDrawer } from './components/deactivate-account-confirmation-drawer/DeactivateAccountConfirmationDrawer'

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
      <OverflowMenuDrawer />
      <DeactivateAccountConfirmationDrawer />
      <TransferAudioMobileDrawer />
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
      <Provider store={store}>
        <PortalProvider>
          <WebRefContextProvider>
            <GoogleCast webRef={webRef} />
            <WebApp webRef={webRef} />
            <SignOnNav />
            <Search />
            {/*
        Note: it is very important that Notifications is rendered after WebApp.
        On Android, regardless of position: absolute, WebApp will steal all of Notifications
        touch targets and onPress will not work.
      */}
            <Notifications webRef={webRef} />

            {/*
            Commenting out BottomBar until the drawers and overlays are migrated to RN
          */}
            {/* <BottomBar /> */}
            <Drawers />
            <Modals />
            <Audio webRef={webRef} />
            <OAuth webRef={webRef} />
            <Airplay webRef={webRef} />
          </WebRefContextProvider>
        </PortalProvider>
      </Provider>
    </SafeAreaProvider>
  )
}

export default App
