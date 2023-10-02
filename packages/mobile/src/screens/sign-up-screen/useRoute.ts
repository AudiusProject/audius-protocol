import type { RouteProp } from '@react-navigation/core'
import { useRoute as useRouteRN } from '@react-navigation/core'

import type { SignUpScreenParamList } from './types'

export const useRoute = <RouteName extends keyof SignUpScreenParamList>() => {
  return useRouteRN<RouteProp<SignUpScreenParamList, RouteName>>()
}
