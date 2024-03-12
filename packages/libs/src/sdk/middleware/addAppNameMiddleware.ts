import fetch from 'cross-fetch'

import { DeveloperAppsApi } from '../api/developer-apps/DeveloperAppsApi'
import {
  type Middleware,
  type RequestContext,
  type FetchParams,
  Configuration,
  querystring
} from '../api/generated/default'

let appName: string | undefined

/**
 * Appends the configured app_name to the query string for tracking API usage
 * @param options the middleware options
 * @param {string} options.appName the name of the app using the SDK
 */
export const addAppNameMiddleware = ({
  appName: providedAppName,
  services
}: {
  appName?: string
  services: any
}): Middleware => {
  appName = providedAppName
  return {
    pre: async (context: RequestContext): Promise<FetchParams> => {
      // If an app name is not provided, fetch the name from the dev app
      if (!appName) {
        const middleware = [services.discoveryNodeSelector.createMiddleware()]
        const apiClientConfig = new Configuration({
          fetchApi: fetch,
          middleware
        })
        const developerApps = new DeveloperAppsApi(
          apiClientConfig,
          services.entityManager,
          services.auth
        )

        appName = (
          await developerApps.getDeveloperApp({
            address: await services.auth.getAddress()
          })
        ).data?.name
      }

      return {
        ...context,
        url:
          context.url +
          (context.url.includes('?') ? '&' : '?') +
          querystring({ app_name: appName ?? '' }),
        init: {
          ...context.init
        }
      }
    }
  }
}
