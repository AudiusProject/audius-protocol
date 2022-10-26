import { Dimensions, Platform, StatusBar } from 'react-native'
import { getNavigationBarHeight } from 'react-native-android-navbar-height'
import { call, put } from 'typed-redux-saga'

import { setAndroidNavigationBarHeight } from './slice'

function* calculateAndroidNavigationBarHeight() {
  if (Platform.OS === 'android') {
    const scale = Dimensions.get('screen').scale
    const navigationBarHeight = yield* call(getNavigationBarHeight)

    // Account for statusBar height because it is translucent and `getNavigationbarHeight`
    // does not account for it
    const statusBarHeight = StatusBar.currentHeight ?? 0

    yield* put(
      setAndroidNavigationBarHeight({
        androidNavigationBarHeight:
          navigationBarHeight / scale - statusBarHeight
      })
    )
  }
}

export default function sagas() {
  return [calculateAndroidNavigationBarHeight]
}
