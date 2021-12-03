import React, { useCallback, useRef, useState } from 'react'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ParamListBase } from '@react-navigation/native'
import {
  CardStyleInterpolators,
  createStackNavigator
} from '@react-navigation/stack'
import { Animated, StyleSheet, View } from 'react-native'

import BottomTabBar, { BottomTabBarProps } from 'app/components/bottom-tab-bar'
import NowPlayingDrawer from 'app/components/now-playing-drawer/NowPlayingDrawer'
import FeedScreen from 'app/screens/feed-screen'
import ProfileScreen from 'app/screens/profile-screen'
import TrackScreen from 'app/screens/track-screen'

import { FeedStackParamList } from './types'

const EmptyScreen = () => {
  return <View />
}

const styles = StyleSheet.create({
  tabNavigator: {
    position: 'absolute',
    bottom: 0,
    height: '100%',
    width: '100%'
  }
})

/**
 * This function is used to create a stack containing common screens like
 * track and profile
 * @param baseScreen The screen to use as the base of the stack
 * @returns Stack.Navigator
 */
const createStackScreen = <StackParamList extends ParamListBase>(
  baseScreen: (
    Stack: ReturnType<typeof createStackNavigator>
  ) => React.ReactNode
) => {
  const Stack = createStackNavigator<StackParamList>()
  return () => (
    <Stack.Navigator
      screenOptions={{
        cardOverlayEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureEnabled: true,
        gestureResponseDistance: 1000
      }}
    >
      {baseScreen(Stack)}
      <Stack.Screen name='track' component={TrackScreen} />
      <Stack.Screen name='profile' component={ProfileScreen} />
    </Stack.Navigator>
  )
}

/**
 * An example stack for the feed screen
 */
const FeedStackScreen = createStackScreen<FeedStackParamList>(Stack => (
  <Stack.Screen name='feed-screen' component={FeedScreen} />
))

const Tab = createBottomTabNavigator()

type BottomTabNavigatorProps = {
  onBottomTabBarLayout: BottomTabBarProps['onLayout']
}

/**
 * The bottom tab navigator
 *
 * TODO: This navigator is only displayed when the user is authed, so we should
 * move drawers, modals, notifications in here. Need to wait until fully migrated to RN
 * because of the way the top level navigator is hidden to display the WebView
 */
const BottomTabNavigator = ({
  onBottomTabBarLayout
}: BottomTabNavigatorProps) => {
  // Set handlers for the NowPlayingDrawer and BottomTabBar
  // When the drawer is open, the bottom bar should hide (animated away).
  // When the drawer is closed, the bottom bar should reappear (animated in).
  const bottomBarTranslationAnim = useRef(new Animated.Value(0)).current
  // Track bottom bar display properties as an object, so every update
  // can be listened to, even if we go from hidden => hidden
  const [bottomBarDisplay, setBottomBarDisplay] = useState({
    isShowing: true
  })

  const onNowPlayingDrawerOpen = useCallback(() => {
    setBottomBarDisplay({ isShowing: false })
  }, [setBottomBarDisplay])
  const onNowPlayingDrawerClose = useCallback(() => {
    setBottomBarDisplay({ isShowing: true })
  }, [setBottomBarDisplay])

  return (
    <>
      <View style={styles.tabNavigator}>
        <Tab.Navigator
          tabBar={props => (
            <>
              <NowPlayingDrawer
                onOpen={onNowPlayingDrawerOpen}
                onClose={onNowPlayingDrawerClose}
                bottomBarTranslationAnim={bottomBarTranslationAnim}
              />
              <BottomTabBar
                {...props}
                onLayout={onBottomTabBarLayout}
                display={bottomBarDisplay}
                translationAnim={bottomBarTranslationAnim}
              />
            </>
          )}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name='feed' component={FeedStackScreen} />
          <Tab.Screen name='trending' component={EmptyScreen} />
          <Tab.Screen name='explore' component={EmptyScreen} />
          <Tab.Screen name='favorites' component={EmptyScreen} />
          <Tab.Screen name='profile' component={EmptyScreen} />
        </Tab.Navigator>
      </View>
    </>
  )
}

export default BottomTabNavigator
