import React, { useCallback, useRef, useState } from 'react'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ParamListBase } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { Animated, StyleSheet, View } from 'react-native'

import BottomTabBar, { BottomTabBarProps } from 'app/components/bottom-tab-bar'
import NowPlayingDrawer from 'app/components/now-playing-drawer/NowPlayingDrawer'
import { AudioScreen } from 'app/screens/audio-screen'
import { EditProfileScreen } from 'app/screens/edit-profile-screen'
import ExploreScreen from 'app/screens/explore-screen'
import { UNDER_THE_RADAR } from 'app/screens/explore-screen/smartCollections'
import { TrendingUndergroundScreen } from 'app/screens/explore-screen/tabs/ForYouTab'
import FavoritesScreen from 'app/screens/favorites-screen'
import { FeedScreen } from 'app/screens/feed-screen'
import { ProfileScreen } from 'app/screens/profile-screen'
import {
  AboutScreen,
  AccountSettingsScreen,
  NotificationSettingsScreen,
  SettingsScreen
} from 'app/screens/settings-screen'
import { SmartCollectionScreen } from 'app/screens/smart-collection-screen/SmartCollectionScreen'
import { TrendingScreen } from 'app/screens/trending-screen'

import { BaseStackNavigator } from './BaseStackNavigator'
import {
  ExploreStackParamList,
  FavoritesStackParamList,
  FeedStackParamList,
  ProfileStackParamList,
  TrendingStackParamList
} from './types'

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
 */
const createStackScreen = <StackParamList extends ParamListBase>(
  baseScreen: (
    Stack: ReturnType<typeof createStackNavigator>
  ) => React.ReactNode
) => {
  const Stack = createStackNavigator<StackParamList>()
  return () => <BaseStackNavigator Stack={Stack} baseScreen={baseScreen} />
}

/**
 * An example stack for the feed screen
 */
const FeedStackScreen = createStackScreen<FeedStackParamList>(Stack => (
  <Stack.Screen name='FeedStack' component={FeedScreen} />
))

const TrendingStackScreen = createStackScreen<TrendingStackParamList>(Stack => (
  <Stack.Screen name='TrendingStack' component={TrendingScreen} />
))

const ExploreStackScreen = createStackScreen<ExploreStackParamList>(Stack => (
  <>
    <Stack.Screen name='ExploreStack' component={ExploreScreen} />
    <Stack.Screen
      name='TrendingUnderground'
      component={TrendingUndergroundScreen}
    />
    <Stack.Screen
      name='UnderTheRadar'
      component={() => (
        <SmartCollectionScreen smartCollection={UNDER_THE_RADAR} />
      )}
    />
  </>
))

const FavoritesStackScreen = createStackScreen<FavoritesStackParamList>(
  Stack => <Stack.Screen name='FavoritesStack' component={FavoritesScreen} />
)

const ProfileStackScreen = createStackScreen<ProfileStackParamList>(Stack => (
  <>
    <Stack.Screen name='ProfileStack' component={ProfileScreen} />
    <Stack.Screen name='EditProfile' component={EditProfileScreen} />
    <Stack.Screen name='SettingsScreen' component={SettingsScreen} />
    <Stack.Screen name='AboutScreen' component={AboutScreen} />
    <Stack.Screen
      name='AccountSettingsScreen'
      component={AccountSettingsScreen}
    />
    <Stack.Screen
      name='NotificationSettingsScreen'
      component={NotificationSettingsScreen}
    />
    <Stack.Screen name='AudioScreen' component={AudioScreen} />
  </>
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
export const BottomTabNavigator = ({
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
        screenOptions={{ headerShown: false, unmountOnBlur: true }}
      >
        <Tab.Screen name='feed' component={FeedStackScreen} />
        <Tab.Screen name='trending' component={TrendingStackScreen} />
        <Tab.Screen name='explore' component={ExploreStackScreen} />
        <Tab.Screen name='favorites' component={FavoritesStackScreen} />
        <Tab.Screen name='profile' component={ProfileStackScreen} />
      </Tab.Navigator>
    </View>
  )
}
