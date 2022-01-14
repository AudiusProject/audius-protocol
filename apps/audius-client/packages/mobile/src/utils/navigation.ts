import { NavigationState } from '@react-navigation/native'
import { Maybe } from 'audius-client/src/common/utils/typeUtils'

export const getNavigationStateAtRoute = (routeSegments: string[]) => (
  state?: NavigationState
): Maybe<NavigationState> => {
  if (!state) {
    return undefined
  }

  if (!routeSegments.length) {
    return state
  }

  const firstRouteSegment = routeSegments[0]
  const route = state.routes.find(({ name }) => name === firstRouteSegment)
  return getNavigationStateAtRoute(routeSegments.slice(1))(
    route?.state as NavigationState
  )
}
