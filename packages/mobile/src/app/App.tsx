import { AudiusQueryContext } from '@audius/common'
import { PortalProvider, PortalHost } from '@gorhom/portal'
import * as Sentry from '@sentry/react-native'
import { Platform, UIManager } from 'react-native'
import Config from 'react-native-config'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  SafeAreaProvider,
  initialWindowMetrics
} from 'react-native-safe-area-context'
import TrackPlayer from 'react-native-track-player'
import { Provider } from 'react-redux'
import { useEffectOnce } from 'react-use'
import { PersistGate } from 'redux-persist/integration/react'
import FlipperAsyncStorage from 'rn-flipper-async-storage-advanced'

import HCaptcha from 'app/components/hcaptcha'
import NavigationContainer from 'app/components/navigation-container'
import { NotificationReminder } from 'app/components/notification-reminder/NotificationReminder'
import OAuth from 'app/components/oauth/OAuth'
import { RateCtaReminder } from 'app/components/rate-cta-drawer/RateCtaReminder'
import { Toasts } from 'app/components/toasts'
import { useEnterForeground } from 'app/hooks/useAppState'
import { incrementSessionCount } from 'app/hooks/useSessionCount'
import { RootScreen } from 'app/screens/root-screen'
import { WalletConnectProvider } from 'app/screens/wallet-connect'
import { apiClient } from 'app/services/audius-api-client'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { env } from 'app/services/env'
import { setLibs } from 'app/services/libs'
import { remoteConfigInstance } from 'app/services/remote-config'
import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { persistor, store } from 'app/store'
import {
  forceRefreshConnectivity,
  subscribeToNetworkStatusUpdates
} from 'app/utils/reachability'
import { reportToSentry } from 'app/utils/reportToSentry'

import { AppContextProvider } from './AppContextProvider'
import { Drawers } from './Drawers'
import ErrorBoundary from './ErrorBoundary'
import { ThemeProvider } from './ThemeProvider'
import { AudiusTrpcProvider } from './TrpcProvider'

Sentry.init({
  dsn: Config.SENTRY_DSN
})

const Airplay = Platform.select({
  ios: () => require('../components/audio/Airplay').default,
  android: () => () => null
})?.()

// Need to enable this flag for LayoutAnimation to work on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
  }
}

// Increment the session count when the App.tsx code is first run
incrementSessionCount()

const Modals = () => {
  return <HCaptcha />
}

const App = () => {
  // Reset libs so that we get a clean app start
  useEffectOnce(() => {
    setLibs(null)
    subscribeToNetworkStatusUpdates()
    TrackPlayer.setupPlayer()
  })

  useEnterForeground(() => {
    forceRefreshConnectivity()
  })

  return (
    <AppContextProvider>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <FlipperAsyncStorage />
        <Provider store={store}>
          <AudiusTrpcProvider>
            <AudiusQueryContext.Provider
              value={{
                apiClient,
                audiusSdk,
                audiusBackend: audiusBackendInstance,
                dispatch: store.dispatch,
                reportToSentry,
                env,
                fetch,
                remoteConfigInstance
              }}
            >
              <PersistGate loading={null} persistor={persistor}>
                <ThemeProvider>
                  <WalletConnectProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <PortalProvider>
                        <ErrorBoundary>
                          <NavigationContainer>
                            <Toasts />
                            <Airplay />
                            <RootScreen />
                            <Drawers />
                            <Modals />
                            <OAuth />
                            <NotificationReminder />
                            <RateCtaReminder />
                            <PortalHost name='ChatReactionsPortal' />
                          </NavigationContainer>
                        </ErrorBoundary>
                      </PortalProvider>
                    </GestureHandlerRootView>
                  </WalletConnectProvider>
                </ThemeProvider>
              </PersistGate>
            </AudiusQueryContext.Provider>
          </AudiusTrpcProvider>
        </Provider>
      </SafeAreaProvider>
    </AppContextProvider>
  )
}

const AppWithSentry = Sentry.wrap(App)

export { AppWithSentry as App }
