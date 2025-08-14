import { Coin } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useQueryContext } from '../utils'

export interface UseArtistCoinParams {
  mint: string
}

export const getArtistCoinQueryKey = (mint: string) =>
  [QUERY_KEYS.coin, mint] as unknown as QueryKey<Coin | undefined>

export const useArtistCoin = <TResult = Coin | undefined>(
  params: UseArtistCoinParams,
  options?: SelectableQueryOptions<Coin | undefined, TResult>
) => {
  const { audiusSdk, env } = useQueryContext()

  return useQuery({
    queryKey: getArtistCoinQueryKey(params.mint),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const response = await sdk.coins.getCoin({ mint: params.mint })
      return response.data
    },
    ...options,
    enabled:
      options?.enabled !== false &&
      !!params.mint &&
      params.mint !== env.USDC_MINT_ADDRESS
  })
}
