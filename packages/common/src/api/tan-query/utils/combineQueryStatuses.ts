import { QueryObserverResult } from '@tanstack/react-query'
import { sumBy } from 'lodash'

/**
 * Combines multiple query statuses into a single status result
 * This is a lightweight version of combineQueryResults that only focuses on status properties
 * and doesn't handle data types or refetch functionality
 *
 * @param queries Array of query results to combine
 * @returns An object with combined status information
 */
export const combineQueryStatuses = (queries: QueryObserverResult[]) => {
  const isPending = queries.some((query) => query.isPending)
  const isError = queries.some((query) => query.isError)
  const isFetching = queries.some((query) => query.isFetching)
  const isLoading = queries.some((query) => query.isLoading)
  const isSuccess = queries.every((query) => query.isSuccess)
  const isFetched = queries.every((query) => query.isFetched)
  const isFetchedAfterMount = queries.every(
    (query) => query.isFetchedAfterMount
  )
  const isPlaceholderData = queries.some((query) => query.isPlaceholderData)

  // Combine error information if any query has an error
  const error = queries.find((query) => query.error)?.error ?? null
  const errorUpdatedAt = queries.reduce((latest, query) => {
    const currentTime = query.errorUpdatedAt
    if (!currentTime) return latest
    if (!latest) return currentTime
    return currentTime > latest ? currentTime : latest
  }, 0)

  // Get the most recent fetch time
  const dataUpdatedAt = queries.reduce((latest, query) => {
    const currentTime = query.dataUpdatedAt
    if (!currentTime) return latest
    if (!latest) return currentTime
    return currentTime > latest ? currentTime : latest
  }, 0)

  // Determine overall status
  let status: 'pending' | 'error' | 'success' = 'success'
  if (isPending) status = 'pending'
  if (isError) status = 'error'

  return {
    error: error as Error,
    isError,
    isFetching,
    isLoading,
    isPending,
    isSuccess,
    status,
    dataUpdatedAt,
    errorUpdatedAt,
    failureCount: sumBy(queries, (q) => q.failureCount ?? 0),
    failureReason: isError ? error : null,
    errorUpdateCount: sumBy(queries, (q) => q.errorUpdateCount ?? 0),
    fetchStatus: isFetching ? 'fetching' : 'idle',
    isLoadingError: queries.some((q) => q.isLoadingError),
    isPaused: queries.some((q) => q.isPaused),
    isRefetchError: queries.some((q) => q.isRefetchError),
    isRefetching: queries.some((q) => q.isRefetching),
    isStale: queries.some((q) => q.isStale),
    isFetched,
    isFetchedAfterMount,
    isPlaceholderData
  }
}
