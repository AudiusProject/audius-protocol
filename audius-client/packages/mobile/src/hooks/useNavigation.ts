import { useCallback, useMemo } from 'react'

import {
  ParamListBase,
  useNavigation as useNavigationNative
} from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import {
  BaseStackParamList,
  ProfileStackParamList,
  SearchParamList
} from 'app/components/app-navigator/types'

import { usePushRouteWeb } from './usePushRouteWeb'

type AppParamList = BaseStackParamList &
  ProfileStackParamList &
  SearchParamList & {
    feed: undefined
    trending: undefined
    explore: undefined
    favorites: undefined
    EditProfile: undefined
    FollowersScreen: undefined
    FollowingScreen: undefined
    FavoritedScreen: undefined
    RepostsScreen: undefined
    TrendingUnderground: undefined
  }

type UseNavigationConfig<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList
> = {
  native: { screen: RouteName; params: ParamList[RouteName] }
  web?: {
    route: string
    fromPage?: string
    fromNativeNotifications?: string
  }
}

type NavigationType = NativeStackNavigationProp<AppParamList>

export const useNavigation = () => {
  const nativeNavigation = useNavigationNative<NavigationType>()
  const pushRouteWeb = usePushRouteWeb()

  const performNavigation = useCallback(
    method => <RouteName extends keyof AppParamList>(
      config: UseNavigationConfig<AppParamList, RouteName>
    ) => {
      const { native, web } = config
      method(native.screen, native.params)
      if (web) {
        pushRouteWeb(web.route, web.fromPage, web.fromNativeNotifications)
      }
    },
    [pushRouteWeb]
  )

  return useMemo(
    () => ({
      navigate: performNavigation(nativeNavigation.navigate),
      push: performNavigation(nativeNavigation.push),
      // Notifying the web layer of the pop action
      // is handled in `createStackScreen`
      goBack: nativeNavigation.goBack
    }),
    [nativeNavigation, performNavigation]
  )
}
