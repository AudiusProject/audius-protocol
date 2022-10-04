import { useCallback, useContext, useMemo } from 'react'

// eslint-disable-next-line import/no-unresolved
import type { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types'
import type {
  ParamListBase,
  StackNavigationState
} from '@react-navigation/native'
import { StackActions, CommonActions } from '@react-navigation/native'
import { isEqual } from 'lodash'

import { AppTabNavigationContext } from 'app/screens/app-screen'
import type { AppTabScreenParamList } from 'app/screens/app-screen/AppTabScreen'

export type ContextualParams = { fromNotifications?: boolean }

type UseNavigationConfig<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList
> = [screen: RouteName, params?: ParamList[RouteName] & ContextualParams]

type UseNavigationOptions = {
  customNativeNavigation?: DrawerNavigationHelpers
}

export const useNavigation = <
  ParamList extends ParamListBase = AppTabScreenParamList
>(
  options?: UseNavigationOptions
) => {
  const { navigation: defaultNativeNavigation } = useContext(
    AppTabNavigationContext
  )

  const nativeNavigation =
    options?.customNativeNavigation || defaultNativeNavigation

  const performNavigation = useCallback(
    (method) =>
      <RouteName extends keyof ParamList>(
        ...config: UseNavigationConfig<ParamList, RouteName>
      ) => {
        const [screen, params] = config
        method(screen, params)
      },
    []
  )

  const performCustomPush = useCallback(
    <RouteName extends keyof ParamList>(
      ...config: UseNavigationConfig<ParamList, RouteName>
    ) => {
      const [screen, params] = config

      const customPushAction = (state: StackNavigationState<ParamList>) => {
        const lastRoute = state.routes[state.routes.length - 1]
        if (
          (screen as string) === lastRoute.name &&
          isEqual(params, lastRoute.params)
        ) {
          // react-navigation considers this a no-op
          return CommonActions.navigate(lastRoute)
        }
        return StackActions.push(screen as string, params)
      }

      nativeNavigation?.dispatch(customPushAction)
    },
    [nativeNavigation]
  )

  return useMemo(
    () => ({
      ...nativeNavigation,
      navigate: performNavigation(nativeNavigation.navigate),
      push:
        'push' in nativeNavigation
          ? performCustomPush
          : () => {
              console.error('Push is not implemented for this navigator')
            },
      replace:
        'replace' in nativeNavigation
          ? performNavigation(nativeNavigation.replace)
          : () => {
              console.error('Replace is not implemented for this navigator')
            },

      // Notifying the web layer of the pop action
      // is handled in `createStackScreen`
      goBack: nativeNavigation.goBack
    }),
    [nativeNavigation, performNavigation, performCustomPush]
  )
}
