import {
  type Middleware,
  type RequestContext,
  type FetchParams,
  querystring
} from '../api/generated/default'

/**
 * Appends the configured app_name to the query string for tracking API usage
 * @param options the middleware options
 * @param {string} options.appName the name of the app using the SDK
 */
export const addAppNameMiddleware = ({
  appName
}: {
  appName: string
}): Middleware => {
  return {
    pre: async (context: RequestContext): Promise<FetchParams> => ({
      url:
        context.url +
        (context.url.includes('?') ? '&' : '?') +
        querystring({ app_name: appName }),
      init: context.init ?? {}
    })
  }
}
