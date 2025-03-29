import { useQueries as useTanQueries } from '@tanstack/react-query'
import type { QueriesOptions, UseQueryResult } from '@tanstack/react-query'

import { TypedQueryClient } from '../typed-query-client'

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
  queryClient?: TypedQueryClient
) {
  return useTanQueries(
    {
      queries: (queries ?? [
        {
          queryKey: ['never-resolves'],
          queryFn: () => new Promise(() => {})
        }
      ]) as readonly [...QueriesOptions<T>],
      // @ts-expect-error
      combine: combineQueryResults<T>,
      ...options
    },
    queryClient
  )
}
