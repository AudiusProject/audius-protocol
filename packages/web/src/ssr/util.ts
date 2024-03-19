import { resolveRoute } from 'vike/routing'
import { PageContextServer } from 'vike/types'

import { staticRoutes } from 'utils/route'

const assetPaths = new Set(['src', 'assets', 'scripts', 'fonts', 'favicons'])

const invalidPaths = new Set(['undefined'])

export const makePageRoute =
  (route: string, pageName?: string) => (pageContext: PageContextServer) => {
    // Don't render page if the route matches any of the asset routes
    if (assetPaths.has(pageContext.urlPathname.split('/')[1])) {
      return false
    }

    if (invalidPaths.has(pageContext.urlPathname.split('/')[1])) {
      return false
    }

    if (
      pageContext.urlPathname.split('/')[route.split('/').length - 1] ===
      'index.css.map'
    ) {
      return false
    }

    // Don't render page if the route matches any of the static routes
    if (staticRoutes.has(pageContext.urlPathname)) {
      return false
    }

    const result = resolveRoute(route, pageContext.urlPathname)
    if (result.match) {
      console.info(`Rendering ${pageName ?? route}`, pageContext.urlPathname)
    }
    return result
  }
