import { Coin } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useQueryContext } from '../utils'

export interface UseArtistCoinByTickerParams {
  ticker: string
}

export const getArtistCoinByTickerQueryKey = (ticker: string) =>
  [QUERY_KEYS.coinByTicker, ticker] as unknown as QueryKey<Coin | undefined>

export const useArtistCoinByTicker = <TResult = Coin | undefined>(
  params: UseArtistCoinByTickerParams,
  options?: SelectableQueryOptions<Coin | undefined, TResult>
) => {
  const { audiusSdk } = useQueryContext()

  return useQuery({
    queryKey: getArtistCoinByTickerQueryKey(params.ticker),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const response = await sdk.coins.getCoinByTicker({ ticker: params.ticker })
      return response.data
    },
    ...options,
    enabled: options?.enabled !== false && !!params.ticker
  })
}
