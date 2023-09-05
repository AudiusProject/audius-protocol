import { useMemo } from 'react'

// eslint-disable-next-line import/no-unresolved
import type { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types'
import type { ParamListBase } from '@react-navigation/native'
import { useNavigation as useNavigationNative } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { throttle } from 'lodash'

import type { AppTabScreenParamList } from 'app/screens/app-screen/AppTabScreen'

export type ContextualParams = { fromNotifications?: boolean }

type UseNavigationConfig<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList
> = [screen: RouteName, params?: ParamList[RouteName] & ContextualParams]

export const useNavigation = <
  ParamList extends ParamListBase = AppTabScreenParamList
>({
  customNativeNavigation
}: {
  customNativeNavigation?: DrawerNavigationHelpers
} = {}) => {
  const defaultNativeNavigation =
    useNavigationNative<NativeStackNavigationProp<ParamList>>()
  const nativeNavigation = customNativeNavigation || defaultNativeNavigation

  const performNavigation = useMemo(
    () =>
      throttle(
        (method) =>
          <RouteName extends keyof ParamList>(
            ...config: UseNavigationConfig<ParamList, RouteName>
          ) => {
            const [screen, params] = config
            method(screen, params)
          },
        1000,
        { leading: true }
      ),
    []
  )

  return useMemo(
    () => ({
      ...nativeNavigation,
      navigate: performNavigation(nativeNavigation.navigate)!,
      push:
        'push' in nativeNavigation
          ? performNavigation!(nativeNavigation.push)!
          : () => {
              console.error('Push is not implemented for this navigator')
            },
      replace:
        'replace' in nativeNavigation
          ? performNavigation(nativeNavigation.replace)!
          : () => {
              console.error('Replace is not implemented for this navigator')
            },

      // Notifying the web layer of the pop action
      // is handled in `createStackScreen`
      goBack: nativeNavigation.goBack
    }),
    [nativeNavigation, performNavigation]
  )
}
