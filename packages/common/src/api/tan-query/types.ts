import {
  DefinedInitialDataOptions,
  UseInfiniteQueryResult,
  UseQueryOptions
} from '@tanstack/react-query'

import { loadNextPage } from './utils/infiniteQueryLoadNextPage'
import { UseLineupQueryData } from './utils/useLineupQuery'

/**
 * Standard tan-query pass-thru options that we use
 */
export type QueryOptions = Pick<
  DefinedInitialDataOptions<any>,
  'staleTime' | 'enabled' | 'placeholderData' | 'refetchOnMount'
>

export type SelectableQueryOptions<TData, TResult = TData> = Omit<
  UseQueryOptions<TData, Error, TResult>,
  'queryKey' | 'queryFn'
>

export type LineupQueryData = UseLineupQueryData &
  Pick<
    UseInfiniteQueryResult,
    | 'data'
    | 'hasNextPage'
    | 'isInitialLoading'
    | 'isLoading'
    | 'isPending'
    | 'isError'
  > & {
    loadNextPage: ReturnType<typeof loadNextPage>
    pageSize?: number
  }

export type FlatUseInfiniteQueryResult<T> = Omit<
  UseInfiniteQueryResult,
  'data' // These types get invalidated by the select modifier changing the output shape
> & {
  data: T[]
}
