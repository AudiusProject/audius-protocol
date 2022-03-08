import { RouteProp, useRoute as useRouteRN } from '@react-navigation/core'

import { BaseStackParamList } from 'app/components/app-navigator/types'

export const useRoute = <RouteName extends keyof BaseStackParamList>() => {
  return useRouteRN<RouteProp<BaseStackParamList, RouteName>>()
}
