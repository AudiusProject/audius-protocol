import { useEffect } from 'react'

import { useAppState } from '@react-native-community/hooks'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigatorScreenParams } from '@react-navigation/native'
import { getBalance } from 'audius-client/src/common/store/wallet/slice'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'

import { AppTabBar } from './AppTabBar'
import { ExploreTabScreen, ExploreTabScreenParamList } from './ExploreTabScreen'
import {
  FavoritesTabScreen,
  FavoritesTabScreenParamList
} from './FavoritesTabScreen'
import { FeedTabScreen, FeedTabScreenParamList } from './FeedTabScreen'
import { ProfileTabScreenParamList, ProfileTabScreen } from './ProfileTabScreen'
import {
  TrendingTabScreen,
  TrendingTabScreenParamList
} from './TrendingTabScreen'

export type AppScreenParamList = {
  feed: NavigatorScreenParams<FeedTabScreenParamList>
  trending: NavigatorScreenParams<TrendingTabScreenParamList>
  explore: NavigatorScreenParams<ExploreTabScreenParamList>
  favorites: NavigatorScreenParams<FavoritesTabScreenParamList>
  profile: NavigatorScreenParams<ProfileTabScreenParamList>
}

const Tab = createBottomTabNavigator()

export const AppScreen = () => {
  const dispatchWeb = useDispatchWeb()
  const appState = useAppState()

  useEffect(() => {
    if (appState === 'active') {
      dispatchWeb(getBalance())
    }
  }, [appState, dispatchWeb])

  return (
    <Tab.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false, unmountOnBlur: true }}>
      <Tab.Screen name='feed' component={FeedTabScreen} />
      <Tab.Screen name='trending' component={TrendingTabScreen} />
      <Tab.Screen name='explore' component={ExploreTabScreen} />
      <Tab.Screen name='favorites' component={FavoritesTabScreen} />
      <Tab.Screen name='profile' component={ProfileTabScreen} />
    </Tab.Navigator>
  )
}
