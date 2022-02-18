import { useCallback, useMemo } from 'react'

import {
  ParamListBase,
  useNavigation as useNavigationNative
} from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { BaseStackParamList } from 'app/components/app-navigator/types'

import { usePushRouteWeb } from './usePushRouteWeb'

type AppParamList = BaseStackParamList & {
  feed: undefined
  trending: undefined
  explore: undefined
  favorites: undefined
  EditProfile: undefined
  FollowersScreen: undefined
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

  const navigate = useCallback(
    <RouteName extends keyof AppParamList>(
      config: UseNavigationConfig<AppParamList, RouteName>
    ) => {
      const { native, web } = config

      nativeNavigation.navigate(native.screen, native.params)
      if (web) {
        pushRouteWeb(web.route, web.fromPage, web.fromNativeNotifications)
      }
    },
    [nativeNavigation, pushRouteWeb]
  )

  const navigation = useMemo(() => ({ navigate }), [navigate])
  return navigation
}
