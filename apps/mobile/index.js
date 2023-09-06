/* eslint-disable import/first */
/* eslint-disable import/order */
import 'react-native-gesture-handler'
// react-native has an issue with inverted lists on Android, and it got worse
// with Android 13. To avoid it we patch a react-native style, but that style
// got deprecated in React Native 0.70. For now the deprecation is limited to a
// JS runtime check, which we disable here.
import ViewReactNativeStyleAttributes from 'react-native/Libraries/Components/View/ReactNativeStyleAttributes'
ViewReactNativeStyleAttributes.scaleY = true
import { AppRegistry, LogBox } from 'react-native'
import TrackPlayer from 'react-native-track-player'

import { name as appName } from './app.json'

// Needed for TextEncoder to work correctly
import 'text-encoding-polyfill'

require('node-libs-react-native/globals')
// Needed for @solana/web3.js to run correctly
require('react-native-get-random-values')
require('react-native-url-polyfill/auto')

const { App } = require('./src/app')

// https://github.com/react-navigation/react-navigation/issues/9882
LogBox.ignoreLogs(['new NativeEventEmitter'])
// Ignore LogBox logs for preferred log messages in external
// React Native debug tools
LogBox.ignoreAllLogs()

AppRegistry.registerComponent(appName, () => App)
TrackPlayer.registerPlaybackService(() => require('./audio-service'))
if (__DEV__) {
  require('react-native-performance-flipper-reporter').setupDefaultFlipperReporter()
  const { setResourceLoggingEnabled } = require('react-native-performance')
  setResourceLoggingEnabled(true)
}
