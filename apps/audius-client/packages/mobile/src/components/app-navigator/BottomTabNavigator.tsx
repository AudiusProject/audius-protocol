import { useCallback, useRef, useState } from 'react'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ParamListBase, useNavigationState } from '@react-navigation/native'
import {
  CardStyleInterpolators,
  createStackNavigator
} from '@react-navigation/stack'
import { Animated, StyleSheet, View } from 'react-native'

import BottomTabBar, { BottomTabBarProps } from 'app/components/bottom-tab-bar'
import NowPlayingDrawer from 'app/components/now-playing-drawer/NowPlayingDrawer'
import { EditProfileScreen } from 'app/screens/edit-profile-screen/EditProfileScreen'
import ExploreScreen from 'app/screens/explore-screen'
import FavoritesScreen from 'app/screens/favorites-screen'
import { FeedScreen } from 'app/screens/feed-screen'
import ProfileScreen from 'app/screens/profile-screen'
import { TrackScreen } from 'app/screens/track-screen'
import { TrendingScreen } from 'app/screens/trending-screen'

import { TopBar } from './TopBar'
import {
  BaseStackParamList,
  ExploreStackParamList,
  FavoritesStackParamList,
  FeedStackParamList,
  TrendingStackParamList
} from './types'

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
        gestureResponseDistance: 1000,
        header: props => <TopBar {...props} />,
        headerStyle: { height: 87 },
        headerMode: 'float'
      }}
    >
      {baseScreen(Stack)}
      <Stack.Screen name='track' component={TrackScreen} />
      <Stack.Screen name='profile' component={ProfileScreen} />
      <Stack.Screen name='EditProfile' component={EditProfileScreen} />
    </Stack.Navigator>
  )
}

/**
 * An example stack for the feed screen
 */
const FeedStackScreen = createStackScreen<FeedStackParamList>(Stack => (
  <Stack.Screen name='feed-stack' component={FeedScreen} />
))

const TrendingStackScreen = createStackScreen<TrendingStackParamList>(Stack => (
  <Stack.Screen name='trending-stack' component={TrendingScreen} />
))

const ExploreStackScreen = createStackScreen<ExploreStackParamList>(Stack => (
  <Stack.Screen name='explore-stack' component={ExploreScreen} />
))

const FavoritesStackScreen = createStackScreen<FavoritesStackParamList>(
  Stack => <Stack.Screen name='favorites-stack' component={FavoritesScreen} />
)

const ProfileStackScreen = createStackScreen<BaseStackParamList>(Stack => (
  <Stack.Screen name='profile-stack' component={ProfileScreen} />
))

const Tab = createBottomTabNavigator()

type BottomTabNavigatorProps = {
  onBottomTabBarLayout: BottomTabBarProps['onLayout']
  nativeScreens: Set<string>
}

/**
 * The bottom tab navigator
 *
 * TODO: This navigator is only displayed when the user is authed, so we should
 * move drawers, modals, notifications in here. Need to wait until fully migrated to RN
 * because of the way the top level navigator is hidden to display the WebView
 */
const BottomTabNavigator = ({
  nativeScreens,
  onBottomTabBarLayout
}: BottomTabNavigatorProps) => {
  const state = useNavigationState(state => state)

  if (state) {
    let currentState: any = state
    const routePath: string[] = []

    while (
      currentState?.routeNames?.length > 0 &&
      currentState?.routes?.length > 0
    ) {
      routePath.push(currentState.routeNames[currentState.index])
      currentState = currentState.routes[currentState.index].state
    }
  }

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

  const screen = (name: string, Component: () => JSX.Element) => (
    <Tab.Screen
      name={name}
      component={nativeScreens.has(name) ? Component : EmptyScreen}
    />
  )

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
        screenOptions={{ headerShown: false }}
      >
        {screen('feed', FeedStackScreen)}
        {screen('trending', TrendingStackScreen)}
        {screen('explore', ExploreStackScreen)}
        {screen('favorites', FavoritesStackScreen)}
        {screen('profile', ProfileStackScreen)}
      </Tab.Navigator>
    </View>
  )
}

export default BottomTabNavigator
