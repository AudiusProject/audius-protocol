import { resolveRoute } from 'vike/routing'

import { staticRoutes } from 'utils/route'

export default (pageContext) => {
  // Don't render profile page if the route matches any of the static routes
  if (staticRoutes.has(pageContext.urlPathname)) {
    return false
  }

  return resolveRoute('/@handle', pageContext.urlPathname)
}
