import { Dimensions, Platform } from 'react-native'
import { getNavigationBarHeight } from 'react-native-android-navbar-height'
import { call, put } from 'typed-redux-saga'

import { setAndroidNavigationBarHeight } from './slice'

function* calculateAndroidNavigationBarHeight() {
  if (Platform.OS === 'android') {
    const scale = Dimensions.get('screen').scale
    const navigationBarHeight = yield* call(getNavigationBarHeight)

    yield* put(
      setAndroidNavigationBarHeight({
        androidNavigationBarHeight: navigationBarHeight / scale
      })
    )
  }
}

export default function sagas() {
  return [calculateAndroidNavigationBarHeight]
}
