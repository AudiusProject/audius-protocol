import { useState } from 'react'

import { PortalProvider } from '@gorhom/portal'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Sentry from '@sentry/react-native'
import { Platform, UIManager } from 'react-native'
import Config from 'react-native-config'
import {
  SafeAreaProvider,
  initialWindowMetrics
} from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import { useAsync, useEffectOnce } from 'react-use'

import { Audio } from 'app/components/audio/Audio'
import HCaptcha from 'app/components/hcaptcha'
import NavigationContainer from 'app/components/navigation-container'
import OAuth from 'app/components/oauth/OAuth'
import { ToastContextProvider } from 'app/components/toast/ToastContext'
import { WebAppAccountSync } from 'app/components/web-app-account-sync'
import { incrementSessionCount } from 'app/hooks/useSessionCount'
import { RootScreen } from 'app/screens/root-screen'
import { store } from 'app/store'
import {
  forceRefreshConnectivity,
  subscribeToNetworkStatusUpdates
} from 'app/utils/reachability'

import { Drawers } from './Drawers'
import ErrorBoundary from './ErrorBoundary'
import { NotificationReminder } from './components/notification-reminder/NotificationReminder'
import { OfflineDownloader } from './components/offline-downloads/OfflineDownloader'
import { RateCtaReminder } from './components/rate-cta-drawer/RateCtaReminder'
import { ENTROPY_KEY } from './constants/storage-keys'
import { useEnterForeground } from './hooks/useAppState'
import { WalletConnectProvider } from './screens/wallet-connect'
import { setLibs } from './services/libs'

Sentry.init({
  dsn: Config.SENTRY_DSN
})

const Airplay = Platform.select({
  ios: () => require('./components/audio/Airplay').default,
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
  })

  const [isReadyToSetupBackend, setIsReadyToSetupBackend] = useState(false)

  useAsync(async () => {
    // Require entropy to exist before setting up backend
    const entropy = await AsyncStorage.getItem(ENTROPY_KEY)
    setIsReadyToSetupBackend(!!entropy)
  }, [])

  useEffectOnce(() => {
    subscribeToNetworkStatusUpdates()
  })

  useEnterForeground(() => {
    forceRefreshConnectivity()
  })

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Provider store={store}>
        <WalletConnectProvider>
          <PortalProvider>
            <ToastContextProvider>
              <ErrorBoundary>
                <NavigationContainer>
                  {!isReadyToSetupBackend ? (
                    <WebAppAccountSync
                      setIsReadyToSetupBackend={setIsReadyToSetupBackend}
                    />
                  ) : null}
                  <Airplay />
                  <RootScreen isReadyToSetupBackend={isReadyToSetupBackend} />
                  <Drawers />
                  <Modals />
                  <Audio />
                  <OAuth />
                  <NotificationReminder />
                  <RateCtaReminder />
                  <OfflineDownloader />
                </NavigationContainer>
              </ErrorBoundary>
            </ToastContextProvider>
          </PortalProvider>
        </WalletConnectProvider>
      </Provider>
    </SafeAreaProvider>
  )
}

export default Sentry.wrap(App)
