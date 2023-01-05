import type { ResponseContext } from '../api/generated/default'

/**
 * Parses the JSON response body and returns it, replacing the return value of the Response with an Object
 * Note: Place this last in the list of middlewares to avoid conflicts with other middleware that depends on the Response
 * @param options options for the middleware
 * @param {boolean} options.extractData- whether or not to get the nested `data` property
 */
export const jsonResponseMiddleware = ({
  extractData = false
}: {
  extractData: boolean
}) => {
  return {
    post: async (context: ResponseContext) => {
      const json = await (context.response as Response).json()
      if (extractData) {
        return json.data
      }
      return json
    }
  }
}
