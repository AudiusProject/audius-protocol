import { NativeEventEmitter, NativeModules, Platform } from 'react-native'
import RNRestart from 'react-native-restart'

const handleAppDestroy = async () => {
  console.log('handleAppDestroy is getting called?')
  // Only handle this on Android
  if (Platform.OS !== 'android') return
  if (__DEV__) {
    NativeModules.DevSettings.reload()
  } else {
    // Use react-native-restart to restart the app in production
    RNRestart.Restart()
  }
}

// Listen for the destroy event from MainActivity
const eventEmitter = new NativeEventEmitter()
eventEmitter.addListener('onAppDestroy', handleAppDestroy)

// Export for use in index.js
export { handleAppDestroy }
