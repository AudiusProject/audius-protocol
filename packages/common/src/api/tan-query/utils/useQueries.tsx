import { useEffect, useState } from 'react'

import { useQueries as useTanQueries } from '@tanstack/react-query'
import type {
  QueriesOptions,
  QueriesResults,
  QueryClient
} from '@tanstack/react-query'

import { combineQueryResults } from './combineQueryResults'

type UseQueriesConfig<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>
> = {
  queries: readonly [...QueriesOptions<T>]
  combine?: (result: QueriesResults<T>) => TCombinedResult
}

/**
 * A wrapper around @tanstack/react-query's useQueries function
 * that preserves all type signatures and functionality.
 */
export function useQueries<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>
>(
  { queries, ...options }: UseQueriesConfig<T>,
  queryClient?: QueryClient
): TCombinedResult {
  const [isInitialized, setIsInitialized] = useState(false)

  const queriesLength = queries.length

  useEffect(() => {
    if (queriesLength > 0) {
      setIsInitialized(true)
    }
  }, [queriesLength])

  const queryResults = useTanQueries(
    { queries, combine: combineQueryResults<T>, ...options },
    queryClient
  )

  const isPending = !isInitialized || queryResults.isPending
  const isLoading = !isInitialized || queryResults.isLoading

  return {
    ...queryResults,
    isPending,
    isLoading
  }
}

// Re-export the types from @tanstack/react-query
export type { QueriesOptions, QueriesResults }
