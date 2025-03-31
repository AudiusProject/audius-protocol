import type { RouteProp } from '@react-navigation/core'
import { useRoute as useRouteRN } from '@react-navigation/core'

import type { SignOnScreenParamList } from './types'

export const useRoute = <RouteName extends keyof SignOnScreenParamList>() => {
  return useRouteRN<RouteProp<SignOnScreenParamList, RouteName>>()
}
