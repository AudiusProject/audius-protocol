import { NavigationState } from '@react-navigation/native'

export const getNavigationStateAtRoute = (routeSegments: string[]) => (
  state?: NavigationState
) => {
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
