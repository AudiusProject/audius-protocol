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

/**
 * Navigation state selector that selects the primary route
 * e.g. 'feed', 'trending', 'profile', etc
 */
export const getPrimaryRoute = (state: NavigationState) => {
  // The route at index 2 is the primary route
  return getRoutePath(state)?.[2]
}
