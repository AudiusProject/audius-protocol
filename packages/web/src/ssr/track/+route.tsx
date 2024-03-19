import { resolveRoute } from 'vike/routing'
import { PageContextServer } from 'vike/types'

import { staticRoutes } from 'utils/route'

const assetPaths = new Set(['src', 'assets', 'scripts', 'fonts', 'favicons'])

export default (pageContext: PageContextServer) => {
  // Don't render track page if the route matches any of the asset routes
  if (assetPaths.has(pageContext.urlPathname.split('/')[1])) {
    return false
  }

  if (pageContext.urlPathname.split('/')[2] === 'index.css.map') {
    return false
  }

  // Don't render track page if the route matches any of the static routes
  if (staticRoutes.has(pageContext.urlPathname)) {
    return false
  }

  console.info('Rendering track page', pageContext.urlPathname)
  return resolveRoute('/@handle/@slug', pageContext.urlPathname)
}
