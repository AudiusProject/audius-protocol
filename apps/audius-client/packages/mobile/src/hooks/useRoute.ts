import { RouteProp, useRoute as useRouteRN } from '@react-navigation/core'

import {
  BaseStackParamList,
  ProfileStackParamList
} from 'app/components/app-navigator/types'

export const useRoute = <RouteName extends keyof BaseStackParamList>() => {
  return useRouteRN<RouteProp<BaseStackParamList, RouteName>>()
}

export const useProfileRoute = <
  RouteName extends keyof ProfileStackParamList
>() => {
  return useRouteRN<RouteProp<ProfileStackParamList, RouteName>>()
}
