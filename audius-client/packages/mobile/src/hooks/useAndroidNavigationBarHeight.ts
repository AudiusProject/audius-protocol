import { Dimensions, Platform } from 'react-native'
import { getNavigationBarHeight } from 'react-native-android-navbar-height'
import { useAsync } from 'react-use'

export const useAndroidNavigationBarHeight = () => {
  const { value: androidNavigationBarHeight = 0 } = useAsync(async () => {
    if (Platform.OS === 'android') {
      const scale = Dimensions.get('screen').scale
      const navigationBarHeight = await getNavigationBarHeight()
      return navigationBarHeight / scale
    }
  })

  return androidNavigationBarHeight
}
