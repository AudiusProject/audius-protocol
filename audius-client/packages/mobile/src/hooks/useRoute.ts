import { RouteProp, useRoute as useRouteRN } from '@react-navigation/core'

import { AppTabScreenParamList } from 'app/screens/app-screen'
import { ProfileTabScreenParamList } from 'app/screens/app-screen/ProfileTabScreen'

export const useRoute = <RouteName extends keyof AppTabScreenParamList>() => {
  return useRouteRN<RouteProp<AppTabScreenParamList, RouteName>>()
}

export const useProfileRoute = <
  RouteName extends keyof ProfileTabScreenParamList
>() => {
  return useRouteRN<RouteProp<ProfileTabScreenParamList, RouteName>>()
}
