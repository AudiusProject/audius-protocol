import { matchPath, useLocation, Params } from 'react-router-dom'

/**
 * Given a route, matches on it
 * <T>: The params in the route, e.g. if route=/:handle, params = { handle: string }
 * @param route
 * @returns an object of <T> with the values filled
 */
export function useRouteMatch<T extends Params>(route: string) {
  const location = useLocation()
  const match = matchPath(
    {
      path: route,
      end: true
    },
    location.pathname
  )

  if (match) {
    return match.params as T
  }
  return null
}
