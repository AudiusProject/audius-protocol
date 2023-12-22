import { resolveRoute } from 'vike/routing'
import { PageContextServer } from 'vike/types'

// import { staticRoutes } from 'utils/route'

export default (pageContext: PageContextServer) => {
  // Don't render track page if the route matches any of the static routes
  // if (staticRoutes.has(pageContext.urlPathname)) {
  //   return false
  // }

  return resolveRoute('/@handle/@slug', pageContext.urlPathname)
}
