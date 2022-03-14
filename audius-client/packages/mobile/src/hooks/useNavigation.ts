import { useCallback, useMemo } from 'react'

import {
  ParamListBase,
  useNavigation as useNavigationNative
} from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { AppTabScreenParamList } from 'app/screens/app-screen/AppTabScreen'

import { usePushRouteWeb } from './usePushRouteWeb'

type UseNavigationConfig<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList
> = {
  native: { screen: RouteName; params?: ParamList[RouteName] }
  web?: {
    route: string
    fromPage?: string
    fromNativeNotifications?: string
  }
}

export const useNavigation = <
  ParamList extends ParamListBase = AppTabScreenParamList
>() => {
  const nativeNavigation = useNavigationNative<
    NativeStackNavigationProp<ParamList>
  >()
  const pushRouteWeb = usePushRouteWeb()

  const performNavigation = useCallback(
    method => <RouteName extends keyof ParamList>(
      config: UseNavigationConfig<ParamList, RouteName>
    ) => {
      const { native, web } = config
      method(native.screen, native.params)
      if (web) {
        pushRouteWeb(web.route, web.fromPage, web.fromNativeNotifications)
      }
    },
    // eslint thinks ParamList is a variable
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
