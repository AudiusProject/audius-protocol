import { useEffect, useState } from 'react'

import { Dimensions } from 'react-native'
import { getNavigationBarHeight } from 'react-native-android-navbar-height'

export const useAndroidNavigationBarHeight = () => {
  const [androidNavigationBarHeight, setAndroidNavigationBarHeight] = useState(
    0
  )

  const getAndroidNavigationBarHeight = async () => {
    const scale = Dimensions.get('screen').scale
    const navigationBarHeight = await getNavigationBarHeight()
    setAndroidNavigationBarHeight(navigationBarHeight / scale)
  }
  useEffect(() => {
    getAndroidNavigationBarHeight()
  }, [])
  return androidNavigationBarHeight
}
