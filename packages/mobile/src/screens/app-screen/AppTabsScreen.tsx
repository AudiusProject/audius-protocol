import { walletActions } from '@audius/common/store'
import { useEffect } from 'react'

import { useAppState } from '@react-native-community/hooks'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { NavigatorScreenParams } from '@react-navigation/native'
import { useDispatch } from 'react-redux'

import { AppTabBar } from './AppTabBar'
import type { ExploreTabScreenParamList } from './ExploreTabScreen'
import { ExploreTabScreen } from './ExploreTabScreen'
import type { FavoritesTabScreenParamList } from './FavoritesTabScreen'
import { FavoritesTabScreen } from './FavoritesTabScreen'
import type { FeedTabScreenParamList } from './FeedTabScreen'
import { FeedTabScreen } from './FeedTabScreen'
import { NotificationsTabScreen } from './NotificationsTabScreen'
import type { ProfileTabScreenParamList } from './ProfileTabScreen'
import type { TrendingTabScreenParamList } from './TrendingTabScreen'
import { TrendingTabScreen } from './TrendingTabScreen'
const { getBalance } = walletActions

export type AppScreenParamList = {
  feed: NavigatorScreenParams<FeedTabScreenParamList>
  trending: NavigatorScreenParams<TrendingTabScreenParamList>
  explore: NavigatorScreenParams<ExploreTabScreenParamList>
  favorites: NavigatorScreenParams<FavoritesTabScreenParamList>
  profile: NavigatorScreenParams<ProfileTabScreenParamList>
}

const Tab = createBottomTabNavigator()

const screenOptions = { headerShown: false }
const tabBar = (props: BottomTabBarProps) => <AppTabBar {...props} />

export const AppTabsScreen = () => {
  const dispatch = useDispatch()
  const appState = useAppState()

  useEffect(() => {
    if (appState === 'active') {
      dispatch(getBalance())
    }
  }, [appState, dispatch])

  return (
    <Tab.Navigator tabBar={tabBar} screenOptions={screenOptions}>
      <Tab.Screen name='feed' component={FeedTabScreen} />
      <Tab.Screen name='trending' component={TrendingTabScreen} />
      <Tab.Screen name='explore' component={ExploreTabScreen} />
      <Tab.Screen name='library' component={FavoritesTabScreen} />
      <Tab.Screen name='notifications' component={NotificationsTabScreen} />
    </Tab.Navigator>
  )
}
