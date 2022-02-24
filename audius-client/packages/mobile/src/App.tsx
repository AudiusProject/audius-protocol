import { useRef, useEffect } from 'react'

import * as Sentry from '@sentry/react-native'
import { Platform } from 'react-native'
import Config from 'react-native-config'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import { Provider } from 'react-redux'

import AppNavigator from 'app/components/app-navigator/AppNavigator'
// import AudioBreakdownDrawer from 'app/components/audio-breakdown-drawer'
import Audio from 'app/components/audio/Audio'
import GoogleCast from 'app/components/audio/GoogleCast'
import HCaptcha from 'app/components/hcaptcha'
import NavigationContainer from 'app/components/navigation-container'
import Notifications from 'app/components/notifications/Notifications'
import OAuth from 'app/components/oauth/OAuth'
import Search from 'app/components/search/Search'
import { ThemeProvider } from 'app/components/theme/ThemeContext'
import { ToastContextProvider } from 'app/components/toast/ToastContext'
import WebApp from 'app/components/web/WebApp'
import { WebRefContextProvider } from 'app/components/web/WebRef'
import useConnectivity from 'app/components/web/useConnectivity'
import { incrementSessionCount } from 'app/hooks/useSessionCount'
import PushNotifications from 'app/notifications'
import createStore from 'app/store'
import { setup as setupAnalytics } from 'app/utils/analytics'

import { Drawers } from './Drawers'
import ErrorBoundary from './ErrorBoundary'
import { WebAppManager } from './WebAppManager'

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
        <ToastContextProvider>
          <ErrorBoundary>
            <NavigationContainer>
              <WebRefContextProvider>
                <WebAppManager webApp={<WebApp webRef={webRef} />}>
                  <ThemeProvider>
                    <GoogleCast webRef={webRef} />
                    <AppNavigator />
                    <Search />
                    <Notifications webRef={webRef} />
                    <Drawers />
                    <Modals />
                    <Audio webRef={webRef} />
                    <OAuth webRef={webRef} />
                    <Airplay webRef={webRef} />
                  </ThemeProvider>
                </WebAppManager>
              </WebRefContextProvider>
            </NavigationContainer>
          </ErrorBoundary>
        </ToastContextProvider>
      </Provider>
    </SafeAreaProvider>
  )
}

export default Sentry.wrap(App)
