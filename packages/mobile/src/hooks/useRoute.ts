import { RouteProp, useRoute as useRouteRN } from '@react-navigation/core'

import {
  BaseStackParamList,
  ProfileStackParamList,
  SearchParamList
} from 'app/components/app-navigator/types'

export const useRoute = <RouteName extends keyof BaseStackParamList>() => {
  return useRouteRN<RouteProp<BaseStackParamList, RouteName>>()
}

export const useProfileRoute = <
  RouteName extends keyof ProfileStackParamList
>() => {
  return useRouteRN<RouteProp<ProfileStackParamList, RouteName>>()
}

export const useSearchRoute = <RouteName extends keyof SearchParamList>() => {
  return useRouteRN<RouteProp<SearchParamList, RouteName>>()
}
