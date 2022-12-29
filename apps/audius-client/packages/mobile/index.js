import 'react-native-gesture-handler'
import { AppRegistry, LogBox } from 'react-native'
import TrackPlayer from 'react-native-track-player'

import { name as appName } from './app.json'

// Needed for TextEncoder to work correctly
import 'text-encoding-polyfill'

require('node-libs-react-native/globals')
// Needed for @solana/web3.js to run correctly
require('react-native-get-random-values')
require('react-native-url-polyfill/auto')

// Polyfill BigInt
if (typeof BigInt === 'undefined') {
  // eslint-disable-next-line
  BigInt = require('big-integer')
}

const App = require('./src/App').default

// Ignore LogBox logs for preferred log messages in external
// React Native debug tools
LogBox.ignoreAllLogs()

AppRegistry.registerComponent(appName, () => App)
TrackPlayer.registerPlaybackService(() => require('./audio-service'))
