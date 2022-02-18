import { NavigationState } from '@react-navigation/native'
import { Maybe } from 'audius-client/src/common/utils/typeUtils'

/**
 * Navigation state selector that selects state for a given route
 * Can be passed to useNavigationState
 */
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

/**
 * Navigation state selector that selects the current route
 * Can be passed to useNavigationState
 */
export const getRoutePath = (state: NavigationState, routePath?: string[]) => {
  if (!state || state.routes.length === 0) {
    return routePath
  }

  const { state: subState, name } = state.routes[state.index]
  return getRoutePath(subState as NavigationState, [...(routePath ?? []), name])
}
