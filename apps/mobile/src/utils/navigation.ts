import type { NavigationState } from '@react-navigation/native'

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
