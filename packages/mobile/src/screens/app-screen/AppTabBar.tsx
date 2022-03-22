import { useCallback, useRef, useState } from 'react'

import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Animated } from 'react-native'

import { BottomTabBar } from 'app/components/bottom-tab-bar'
import NowPlayingDrawer from 'app/components/now-playing-drawer'

type TabBarProps = BottomTabBarProps

export const AppTabBar = (props: TabBarProps) => {
  // Set handlers for the NowPlayingDrawer and BottomTabBar
  // When the drawer is open, the bottom bar should hide (animated away).
  // When the drawer is closed, the bottom bar should reappear (animated in).
  const bottomBarTranslationAnim = useRef(new Animated.Value(0)).current
  // Track bottom bar display properties as an object, so every update
  // can be listened to, even if we go from hidden => hidden
  const [bottomBarDisplay, setBottomBarDisplay] = useState({
    isShowing: true,
    isPlayBarShowing: false
  })

  const onNowPlayingDrawerOpen = useCallback(() => {
    setBottomBarDisplay(state => ({ ...state, isShowing: false }))
  }, [])

  const onNowPlayingDrawerClose = useCallback(() => {
    setBottomBarDisplay(state => ({ ...state, isShowing: true }))
  }, [])

  const handlePlayBarShowing = useCallback((isPlayBarShowing: boolean) => {
    setBottomBarDisplay(state => ({ ...state, isPlayBarShowing }))
  }, [])

  return (
    <>
      <NowPlayingDrawer
        onOpen={onNowPlayingDrawerOpen}
        onClose={onNowPlayingDrawerClose}
        onPlayBarShowing={handlePlayBarShowing}
        bottomBarTranslationAnim={bottomBarTranslationAnim}
      />
      <BottomTabBar
        {...props}
        display={bottomBarDisplay}
        translationAnim={bottomBarTranslationAnim}
      />
    </>
  )
}
