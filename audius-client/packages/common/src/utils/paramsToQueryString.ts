/**
 * Converts a provided URL params object to a query string
 */
export const paramsToQueryString = (
  params: { [key: string]: string | string[] },
  formatWithoutArray = false
) => {
  if (!params) return ''
  return Object.keys(params)
    .map((k) => {
      if (Array.isArray(params[k])) {
        return (params[k] as string[])
          .map((val: string) =>
            formatWithoutArray
              ? `${encodeURIComponent(k)}=${encodeURIComponent(val)}`
              : `${encodeURIComponent(k)}[]=${encodeURIComponent(val)}`
          )
          .join('&')
      }
      return (
        encodeURIComponent(k) + '=' + encodeURIComponent(params[k] as string)
      )
    })
    .join('&')
}
