import { QueryClient } from '@tanstack/react-query'

export type QueryKeyValue<T = any> = {
  queryKey: unknown[]
  data: T
}

/**
 * Utility function to batch update multiple queries at once.
 * This is useful when you need to update multiple related queries with new data.
 *
 * @param queryClient - The QueryClient instance
 * @param updates - Array of objects containing queryKey and data to update
 * @param options - Optional configuration for setQueriesData
 * @returns void
 *
 * @example
 * ```typescript
 * batchSetQueriesData(queryClient, [
 *   { queryKey: ['user', 123], data: updatedUserData },
 *   { queryKey: ['tracks', 'by-user', 123], data: updatedTracks }
 * ])
 * ```
 */
export const batchSetQueriesData = (
  queryClient: QueryClient,
  updates: QueryKeyValue[],
  options?: {
    updater: (oldData: any, newData: any) => any
  }
) => {
  updates.forEach(({ queryKey, data }) => {
    queryClient.setQueriesData(
      { queryKey },
      options?.updater ? (oldData: any) => options.updater(oldData, data) : data
    )
  })
}
