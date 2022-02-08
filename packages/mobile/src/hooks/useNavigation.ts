import {
  ParamListBase,
  useNavigation as useNavigationNative
} from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { BaseStackParamList } from 'app/components/app-navigator/types'

import { usePushRouteWeb } from './usePushRouteWeb'

type UseNavigationConfig<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList
> = {
  native: { screen: RouteName; params: ParamList[RouteName] }
  web: {
    route: string
    fromPage?: string
    fromNativeNotifications?: string
  }
}

type NavigationType = NativeStackNavigationProp<BaseStackParamList>

export const useNavigation = () => {
  const nativeNavigation = useNavigationNative<NavigationType>()
  const pushRouteWeb = usePushRouteWeb()

  const navigate = <RouteName extends keyof BaseStackParamList>(
    config: UseNavigationConfig<BaseStackParamList, RouteName>
  ) => {
    const { native, web } = config

    nativeNavigation.navigate(native.screen, native.params)
    pushRouteWeb(web.route, web.fromPage, web.fromNativeNotifications)
  }

  const navigation = {
    navigate
  }

  return navigation
}
