import 'react-native-gesture-handler'
import { AppRegistry, LogBox } from 'react-native'

import { name as appName } from './app.json'

require('node-libs-react-native/globals')
require('react-native-url-polyfill/auto')

const App = require('./src/App').default

// Ignore LogBox logs for preferred log messages in external
// React Native debug tools
LogBox.ignoreAllLogs()

AppRegistry.registerComponent(appName, () => App)
