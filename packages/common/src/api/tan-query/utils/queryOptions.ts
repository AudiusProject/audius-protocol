import { QueryOptions } from '../types'

/**
 * For some options (staleTime), tan-query will see an optional query option has set the value to undefined and use that value instead of our global default
 * So instead this helper makes sure that if the staleTime is not provided, it will be set to the global default because we won't pass anything in
 */
export const queryOptions = (options?: QueryOptions) => {
  if (options === undefined) return options
  const queryOptions = { ...options }
  if (options?.staleTime === undefined) {
    delete queryOptions.staleTime
  }
  return queryOptions
}
