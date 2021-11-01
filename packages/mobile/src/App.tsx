import React, { useRef, useEffect } from 'react'
import { Provider } from 'react-redux'
import { Platform } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { PortalProvider } from '@gorhom/portal'

import createStore from './store'
import WebApp from './components/web/WebApp'
import Audio from './components/audio/Audio'
import GoogleCast from './components/audio/GoogleCast'
import OAuth from './components/oauth/OAuth'
import WebView from 'react-native-webview'
import PushNotifications from './notifications'
import { setup as setupAnalytics } from './utils/analytics'
import useConnectivity from './components/web/useConnectivity'
import { incrementSessionCount } from './hooks/useSessionCount'
import Notifications from './components/notifications/Notifications'
import Search from './components/search/Search'
import SignOnNav from './components/signon/NavigationStack'
import { WebRefContextProvider } from './components/web/WebRef'
import BottomBar from './components/bottom-bar'
import MobileUploadDrawer from './components/mobile-upload-drawer'
import CollectibleDetailsDrawer from './components/collectible-details-drawer'

const store = createStore()

const Airplay = Platform.select({
  ios: () => require('./components/audio/Airplay').default,
  android: () => () => null
})()

// Increment the session count when the App.tsx code is first run
incrementSessionCount()

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
            <MobileUploadDrawer />
            <CollectibleDetailsDrawer />
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
