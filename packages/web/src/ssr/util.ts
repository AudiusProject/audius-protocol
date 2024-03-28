import { resolveRoute } from 'vike/routing'
import type { PageContextServer } from 'vike/types'

import { staticRoutes } from 'utils/route'

const assetPaths = new Set(['src', 'assets', 'scripts', 'fonts', 'favicons'])

const invalidPaths = new Set(['undefined'])

export const makePageRoute =
  (routes: string[], pageName?: string) =>
  ({ urlPathname }: PageContextServer) => {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]

      // Don't render page if the route matches any of the asset, invalid, or static  routes
      if (
        assetPaths.has(urlPathname.split('/')[1]) ||
        invalidPaths.has(urlPathname.split('/')[1]) ||
        staticRoutes.has(urlPathname)
      ) {
        continue
      }

      if (
        urlPathname.split('/')[route.split('/').length - 1] === 'index.css.map'
      ) {
        continue
      }

      const result = resolveRoute(route, urlPathname)
      if (result.match) {
        console.info(`Rendering ${pageName ?? route}`, urlPathname)
        return result
      }
    }
    return false
  }
