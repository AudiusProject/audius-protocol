import { QueryObserverResult } from '@tanstack/react-query'

type QueryObserverStatusResult = Pick<
  QueryObserverResult,
  'isPending' | 'isError' | 'isFetching' | 'isLoading' | 'isSuccess'
>

/**
 * Combines multiple query statuses into a single status result
 * This is a lightweight version of combineQueryResults that only focuses on status properties
 * and doesn't handle data types or refetch functionality
 *
 * @param queries Array of query results to combine
 * @returns The first query result with combined status information
 */
export const combineQueryStatuses = (queries: QueryObserverStatusResult[]) => {
  const isPending = queries.some((query) => query.isPending)
  const isError = queries.some((query) => query.isError)
  const isFetching = queries.some((query) => query.isFetching)
  const isLoading = queries.some((query) => query.isLoading)
  const isSuccess = queries.every((query) => query.isSuccess)

  // Mutate the first query result to avoid creating a new object
  const result = queries[0]
  result.isError = isError
  result.isFetching = isFetching
  result.isLoading = isLoading
  result.isPending = isPending
  result.isSuccess = isSuccess

  return result
}
