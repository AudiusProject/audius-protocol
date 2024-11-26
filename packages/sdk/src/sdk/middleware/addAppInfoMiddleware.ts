import { DeveloperAppsApi } from '../api/developer-apps/DeveloperAppsApi'
import {
  type Middleware,
  type RequestContext,
  type FetchParams,
  Configuration,
  querystring
} from '../api/generated/default'
import fetch from '../utils/fetch'

let appName: string | undefined
let apiKey: string | undefined

/**
 * Appends the configured app_name to the query string for tracking API usage
 * @param options the middleware options
 * @param {string} options.appName the name of the app using the SDK
 */
export const addAppInfoMiddleware = ({
  apiKey: providedApiKey,
  appName: providedAppName,
  services
}: {
  apiKey?: string
  appName?: string
  services: any
}): Middleware => {
  apiKey = providedApiKey
  appName = providedAppName
  return {
    pre: async (context: RequestContext): Promise<FetchParams> => {
      // If an app name is not provided, fetch the name from the dev app
      if (!providedAppName) {
        const middleware = [services.discoveryNodeSelector.createMiddleware()]
        const apiClientConfig = new Configuration({
          fetchApi: fetch,
          middleware
        })
        const developerApps = new DeveloperAppsApi(
          apiClientConfig,
          services.entityManager
        )

        apiKey = providedApiKey ?? (await services.auth.getAddress())
        if (apiKey) {
          appName = (
            await developerApps.getDeveloperApp({
              address: apiKey
            })
          ).data?.name
        }
      }

      if (!appName && !apiKey) {
        throw new Error('No appName or apiKey provided')
      }

      return {
        ...context,
        url:
          context.url +
          (context.url.includes('?') ? '&' : '?') +
          querystring({
            app_name: appName ?? '',
            api_key: apiKey ?? ''
          }),
        init: {
          ...context.init
        }
      }
    }
  }
}
