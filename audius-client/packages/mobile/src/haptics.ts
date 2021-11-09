import { Platform } from 'react-native'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'

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
