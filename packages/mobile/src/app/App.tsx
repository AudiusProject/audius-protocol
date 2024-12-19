import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider, PortalHost } from '@gorhom/portal'
import * as Sentry from '@sentry/react-native'
import {
  QueryClientProvider,
  QueryClient as TanQueryClient
} from '@tanstack/react-query'
import { Platform, UIManager } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  SafeAreaProvider,
  initialWindowMetrics
} from 'react-native-safe-area-context'
import TrackPlayer from 'react-native-track-player'
import { Provider } from 'react-redux'
import { useEffectOnce } from 'react-use'
import { PersistGate } from 'redux-persist/integration/react'

import { CommentDrawerProvider } from 'app/components/comments/CommentDrawerContext'
import HCaptcha from 'app/components/hcaptcha'
import NavigationContainer from 'app/components/navigation-container'
import { NotificationReminder } from 'app/components/notification-reminder/NotificationReminder'
import OAuthWebView from 'app/components/oauth/OAuthWebView'
import { RateCtaReminder } from 'app/components/rate-cta-drawer/RateCtaReminder'
import { Toasts } from 'app/components/toasts'
import { useEnterForeground } from 'app/hooks/useAppState'
import { incrementSessionCount } from 'app/hooks/useSessionCount'
import { RootScreen } from 'app/screens/root-screen'
import { WalletConnectProvider } from 'app/screens/wallet-connect'
import { setLibs } from 'app/services/libs'
import { persistor, store } from 'app/store'
import {
  forceRefreshConnectivity,
  subscribeToNetworkStatusUpdates
} from 'app/utils/reachability'

import { AppContextProvider } from './AppContextProvider'
import { AudiusQueryProvider } from './AudiusQueryProvider'
import { Drawers } from './Drawers'
import ErrorBoundary from './ErrorBoundary'
import { ThemeProvider } from './ThemeProvider'
import { AudiusTrpcProvider } from './TrpcProvider'
import { initSentry, navigationIntegration } from './sentry'

initSentry()

const tanQueryClient = new TanQueryClient()

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
    TrackPlayer.setupPlayer({ autoHandleInterruptions: true })
  })

  useEnterForeground(() => {
    forceRefreshConnectivity()
  })

  return (
    <AppContextProvider>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <Provider store={store}>
          <AudiusTrpcProvider>
            <AudiusQueryProvider>
              <QueryClientProvider client={tanQueryClient}>
                <PersistGate loading={null} persistor={persistor}>
                  <ThemeProvider>
                    <WalletConnectProvider>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <PortalProvider>
                          <ErrorBoundary>
                            <NavigationContainer
                              navigationIntegration={navigationIntegration}
                            >
                              <BottomSheetModalProvider>
                                <CommentDrawerProvider>
                                  <Toasts />
                                  <Airplay />
                                  <RootScreen />
                                  <Drawers />
                                  <Modals />
                                  <OAuthWebView />
                                  <NotificationReminder />
                                  <RateCtaReminder />
                                  <PortalHost name='ChatReactionsPortal' />
                                </CommentDrawerProvider>
                              </BottomSheetModalProvider>
                              <PortalHost name='DrawerPortal' />
                            </NavigationContainer>
                          </ErrorBoundary>
                        </PortalProvider>
                      </GestureHandlerRootView>
                    </WalletConnectProvider>
                  </ThemeProvider>
                </PersistGate>
              </QueryClientProvider>
            </AudiusQueryProvider>
          </AudiusTrpcProvider>
        </Provider>
      </SafeAreaProvider>
    </AppContextProvider>
  )
}

const AppWithSentry = Sentry.wrap(App)

export { AppWithSentry as App }
