import { UseQueryResult } from '@tanstack/react-query'

type QueryStatus = Pick<UseQueryResult, 'isLoading' | 'isError' | 'isFetching | 'status''>

/**
 * Combines multiple TanStack Query statuses into a single status object
 * @param queries Array of query results to combine
 * @returns Combined status with isLoading, isError, and isFetching flags
 */
export function combineQueryStatus(queries: QueryStatus[]) {
  const status = queries.reduce(
    (acc, query) => {
      acc.isLoading = acc.isLoading || query.isLoading
      acc.isError = acc.isError || query.isError
      acc.isFetching = acc.isFetching || query.isFetching
      return acc
    },
    {
      isLoading: false,
      isError: false,
      isFetching: false
    }
  )
  return status
}
