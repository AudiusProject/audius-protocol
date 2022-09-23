import 'react-native-gesture-handler'
import { AppRegistry, LogBox } from 'react-native'

import { name as appName } from './app.json'

// Needed for TextEncoder to work correctly
import 'text-encoding-polyfill'
import { enableFreeze } from 'react-native-screens'

require('node-libs-react-native/globals')
// Needed for @solana/web3.js to run correctly
require('react-native-get-random-values')
require('react-native-url-polyfill/auto')

enableFreeze(true)

const App = require('./src/App').default

// Ignore LogBox logs for preferred log messages in external
// React Native debug tools
LogBox.ignoreAllLogs()

AppRegistry.registerComponent(appName, () => App)
