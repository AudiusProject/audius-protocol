import { matchPath, useHistory } from 'react-router-dom'

/**
 * Given a route, matches on it
 * <T>: The params in the route, e.g. if route=/:handle, params = { handle: string }
 * @param route
 * @returns an object of <T> with the values filled
 */
export function useRouteMatch<T extends { [K in keyof T]?: string }>(
  route: string
) {
  const { location } = useHistory()
  const { pathname } = location
  const match = matchPath<T>(pathname, {
    path: route,
    exact: true
  })
  if (match) {
    return match.params
  }
  return null
}
