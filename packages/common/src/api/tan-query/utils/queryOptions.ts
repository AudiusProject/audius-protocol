import { QueryOptions } from '../types'

export const queryOptions = (options?: QueryOptions) => {
  if (options === undefined) return options
  const queryOptions = { ...options }
  if (options?.staleTime === undefined) {
    delete queryOptions.staleTime
  }
  return queryOptions
}
