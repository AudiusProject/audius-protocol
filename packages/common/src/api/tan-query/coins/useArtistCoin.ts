import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useQueryContext } from '../utils'

export interface UseArtistCoinParams {
  mint: string
}

export const getArtistCoinQueryKey = (mint: string) =>
  [QUERY_KEYS.coin, mint] as unknown as QueryKey<any>

export const useArtistCoin = <TResult = any>(
  params: UseArtistCoinParams,
  options?: SelectableQueryOptions<any, TResult>
) => {
  const { audiusSdk, env } = useQueryContext()

  return useQuery({
    queryKey: getArtistCoinQueryKey(params.mint),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const response = await sdk.coins.getCoin({ mint: params.mint })
      return response.data
    },
    enabled:
      options?.enabled !== false &&
      !!params.mint &&
      params.mint !== env.USDC_MINT_ADDRESS,
    ...options
  })
}
