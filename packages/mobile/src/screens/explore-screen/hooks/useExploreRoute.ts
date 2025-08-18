import type { RouteProp } from '@react-navigation/core'
import { useRoute as useRouteRN } from '@react-navigation/core'

import type { ExploreTabScreenParamList } from '../../app-screen/ExploreTabScreen'

/**
 * Custom hook for explore tab routes that provides type-safe access to route parameters
 */
export const useExploreRoute = <
  RouteName extends keyof ExploreTabScreenParamList
>() => {
  return useRouteRN<RouteProp<ExploreTabScreenParamList, RouteName>>()
}
