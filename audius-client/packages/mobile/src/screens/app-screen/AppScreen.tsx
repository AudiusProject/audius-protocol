import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigatorScreenParams } from '@react-navigation/native'

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
