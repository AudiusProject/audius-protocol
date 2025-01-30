import {
  DefinedInitialDataOptions,
  UseInfiniteQueryResult
} from '@tanstack/react-query'

import { loadNextPage } from './utils/infiniteQueryLoadNextPage'
import { UseLineupQueryData } from './utils/useLineupQuery'

/**
 * Standard tan-query pass-thru options that we use
 */
export type QueryOptions = Pick<
  DefinedInitialDataOptions<any>,
  'staleTime' | 'enabled'
>

export type LineupQueryData = UseLineupQueryData &
  Omit<UseInfiniteQueryResult, 'status'> & {
    loadNextPage: ReturnType<typeof loadNextPage>
    pageSize: number
  }
