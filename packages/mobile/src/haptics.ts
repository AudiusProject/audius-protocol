import ReactNativeHapticFeedback from 'react-native-haptic-feedback'
import { Platform } from 'react-native'

const options = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false
}

export const light = () => {
  if (Platform.OS === 'android') {
    // @ts-ignore
    ReactNativeHapticFeedback.trigger('keyboardPress', options)
  } else {
    ReactNativeHapticFeedback.trigger('impactLight', options)
  }
}
