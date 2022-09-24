import { useRef } from 'react'

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Animated } from 'react-native'

import { BottomTabBar } from 'app/components/bottom-tab-bar'
import { FULL_DRAWER_HEIGHT } from 'app/components/drawer'
import NowPlayingDrawer from 'app/components/now-playing-drawer'

import type { AppTabScreenParamList } from './AppTabScreen'

type TabBarProps = BottomTabBarProps

export const AppTabBar = (props: TabBarProps) => {
  // Set handlers for the NowPlayingDrawer and BottomTabBar
  // When the drawer is open, the bottom bar should hide (animated away).
  // When the drawer is closed, the bottom bar should reappear (animated in).
  const translationAnim = useRef(new Animated.Value(FULL_DRAWER_HEIGHT)).current
  const { navigation } = props
  // For some reason bottom-bar navigation doesn't have .push in type
  const nowPlayingNavigation =
    navigation as unknown as NativeStackNavigationProp<AppTabScreenParamList>

  return (
    <>
      <NowPlayingDrawer
        navigation={nowPlayingNavigation}
        translationAnim={translationAnim}
      />
      <BottomTabBar {...props} translationAnim={translationAnim} />
    </>
  )
}
