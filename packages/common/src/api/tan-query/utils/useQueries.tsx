import { useEffect, useState } from 'react'

import { useQueries as useTanQueries } from '@tanstack/react-query'
import type {
  QueriesOptions,
  QueriesResults,
  QueryClient,
  UseQueryResult
} from '@tanstack/react-query'

import { combineQueryResults } from './combineQueryResults'

type UseQueriesConfig<
  T extends Array<any>,
  TCombinedResult = UseQueryResult<T, Error>
> = {
  queries?: readonly [...QueriesOptions<T>]
  combine?: (result: TCombinedResult[]) => TCombinedResult
}

/**
 * A wrapper around @tanstack/react-query's useQueries function
 * that preserves all type signatures and functionality.
 */
export function useQueries<T extends Array<any>>(
  { queries, ...options }: UseQueriesConfig<T>,
  queryClient?: QueryClient
) {
  const [isInitialized, setIsInitialized] = useState(false)

  const hasQueries = !!queries

  useEffect(() => {
    if (hasQueries) {
      setIsInitialized(true)
    }
  }, [hasQueries])

  const queryResults = useTanQueries(
    {
      queries: (queries ?? []) as readonly [...QueriesOptions<T>],
      // @ts-expect-error
      combine: combineQueryResults<T>,
      ...options
    },
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
