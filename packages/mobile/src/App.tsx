import { useRef, useEffect } from 'react'

import { PortalProvider } from '@gorhom/portal'
import * as Sentry from '@sentry/react-native'
import { Platform } from 'react-native'
import Config from 'react-native-config'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type WebView from 'react-native-webview'
import { Provider } from 'react-redux'

import Audio from 'app/components/audio/Audio'
import HCaptcha from 'app/components/hcaptcha'
import NavigationContainer from 'app/components/navigation-container'
import OAuth from 'app/components/oauth/OAuth'
import { ReachabilityBar } from 'app/components/reachability-bar'
import { ThemeProvider } from 'app/components/theme/ThemeContext'
import { ToastContextProvider } from 'app/components/toast/ToastContext'
import { WebRefContextProvider } from 'app/components/web/WebRef'
import useConnectivity from 'app/components/web/useConnectivity'
import { incrementSessionCount } from 'app/hooks/useSessionCount'
import PushNotifications from 'app/notifications'
import { RootScreen } from 'app/screens/root-screen'
import { store } from 'app/store'
import { setup as setupAnalytics } from 'app/utils/analytics'

import { Drawers } from './Drawers'
import ErrorBoundary from './ErrorBoundary'
import { WebAppManager } from './WebAppManager'

Sentry.init({
  dsn: Config.SENTRY_DSN
})

const Airplay = Platform.select({
  ios: () => require('./components/audio/Airplay').default,
  android: () => () => null
})?.()

// Increment the session count when the App.tsx code is first run
incrementSessionCount()

const Modals = () => {
  return <HCaptcha />
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
          <ToastContextProvider>
            <ErrorBoundary>
              <WebRefContextProvider>
                <WebAppManager webRef={webRef}>
                  <ThemeProvider>
                    <NavigationContainer>
                      <Airplay />
                      <ReachabilityBar />
                      <RootScreen />
                      <Drawers />
                      <Modals />
                      <Audio webRef={webRef} />
                      <OAuth webRef={webRef} />
                    </NavigationContainer>
                  </ThemeProvider>
                </WebAppManager>
              </WebRefContextProvider>
            </ErrorBoundary>
          </ToastContextProvider>
        </PortalProvider>
      </Provider>
    </SafeAreaProvider>
  )
}

export default Sentry.wrap(App)
