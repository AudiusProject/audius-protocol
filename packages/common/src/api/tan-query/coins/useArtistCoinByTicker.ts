import {
  queryOptions,
  useQuery,
  useQueryClient,
  type QueryFunctionContext
} from '@tanstack/react-query'

import {
  useQueryContext,
  type QueryContextType
} from '~/api/tan-query/utils/QueryContext'

import { QUERY_KEYS } from '../queryKeys'

import { useArtistCoin, getArtistCoinQueryKey } from './useArtistCoin'

export interface UseArtistCoinByTickerParams {
  ticker: string
}

const getArtistCoinByTickerQueryKey = (ticker: string) =>
  [QUERY_KEYS.coinByTicker, ticker] as const

type FetchArtistCoinByTickerContext = Pick<QueryContextType, 'audiusSdk'> & {
  queryClient: any
}

const getArtistCoinByTickerQueryFn =
  (context: FetchArtistCoinByTickerContext) =>
  async ({
    queryKey
  }: QueryFunctionContext<
    ReturnType<typeof getArtistCoinByTickerQueryKey>
  >) => {
    const [_ignored, ticker] = queryKey
    const { audiusSdk } = context
    const sdk = await audiusSdk()
    const response = await sdk.coins.getCoinByTicker({
      ticker
    })
    const coin = response.data

    // Prime the artist coin query key if we have the mint
    if (coin?.mint) {
      context.queryClient.setQueryData(getArtistCoinQueryKey(coin.mint), coin)
    }

    return coin?.mint
  }

/**
 * Helper function to get the query options for fetching an artist coin by ticker.
 * Useful for getting the query key tagged with the data type stored in the cache.
 */
export const getArtistCoinByTickerOptions = (
  context: FetchArtistCoinByTickerContext,
  { ticker }: UseArtistCoinByTickerParams
) => {
  return queryOptions({
    queryKey: getArtistCoinByTickerQueryKey(ticker),
    queryFn: getArtistCoinByTickerQueryFn(context),
    enabled: !!ticker
  })
}

export const useArtistCoinByTicker = (
  params: UseArtistCoinByTickerParams,
  options?: Partial<ReturnType<typeof getArtistCoinByTickerOptions>>
) => {
  const context = useQueryContext()
  const queryClient = useQueryClient()

  const { data: mint } = useQuery({
    ...options,
    ...getArtistCoinByTickerOptions({ ...context, queryClient }, params)
  })

  return useArtistCoin(mint!)
}
