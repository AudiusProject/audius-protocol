import { CoinInsights } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useQueryContext } from '../utils'

export interface UseArtistCoinInsightsParams {
  mint: string
}

export const getArtistCoinInsightsQueryKey = (mint: string) =>
  [QUERY_KEYS.coinInsights, mint] as unknown as QueryKey<
    CoinInsights | undefined
  >

export const useArtistCoinInsights = <TResult = CoinInsights | undefined>(
  params: UseArtistCoinInsightsParams,
  options?: SelectableQueryOptions<CoinInsights | undefined, TResult>
) => {
  const { audiusSdk } = useQueryContext()

  return useQuery({
    queryKey: getArtistCoinInsightsQueryKey(params.mint),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const response = await sdk.coins.getCoinInsights({ mint: params.mint })
      return response.data
    },
    enabled: options?.enabled !== false && !!params.mint,
    ...options
  })
}
