import React, { useRef, useEffect } from 'react'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { Platform } from 'react-native'

import createRootReducer from './store'
import WebApp from './components/web/WebApp'
import Audio from './components/audio/Audio'
import GoogleCast from './components/audio/GoogleCast'
import OAuth from './components/oauth/OAuth'
import WebView from 'react-native-webview'
import PushNotifications from './notifications'
import { setup as setupAnalytics } from './utils/analytics'
import useConnectivity from './components/web/useConnectivity'
import { incrementSessionCount } from './utils/useSessionCount'
import Notifications from './components/notifications/Notifications'

const store = createStore(
  createRootReducer(),
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)
export const dispatch = store.dispatch

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
    <Provider store={store}>
      <GoogleCast webRef={webRef} />
      <WebApp webRef={webRef} />
      {/*
      Note: it is very important that Notifications is rendered after WebApp.
      On Android, regardless of position: absolute, WebApp will steal all of Notifications
      touch targets and onPress will not work.
    */}
      <Notifications webRef={webRef} />
      <Audio webRef={webRef} />
      <OAuth webRef={webRef} />
      <Airplay webRef={webRef} />
    </Provider>
  )
}

export default App
