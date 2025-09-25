import { GetCoinsSortMethodEnum, GetCoinsSortDirectionEnum } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { coinListFromSDK, Coin } from '~/adapters/coin'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useQueryContext } from '../utils/QueryContext'

import { getArtistCoinQueryKey } from './useArtistCoin'

export type UseArtistCoinsParams = {
  limit?: number
  offset?: number
  sortMethod?: GetCoinsSortMethodEnum
  sortDirection?: GetCoinsSortDirectionEnum
  query?: string
}

export const getArtistCoinsQueryKey = (params?: UseArtistCoinsParams) =>
  [QUERY_KEYS.coins, 'list', params] as unknown as QueryKey<Coin[]>

export const useArtistCoins = <TResult = Coin[]>(
  params: UseArtistCoinsParams = {},
  options?: SelectableQueryOptions<Coin[], TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getArtistCoinsQueryKey(params),
    queryFn: async () => {
      const sdk = await audiusSdk()

      const response = await sdk.coins.getCoins({
        limit: params.limit,
        offset: params.offset,
        sortMethod: params.sortMethod,
        sortDirection: params.sortDirection,
        query: params.query
      })

      const coins = response?.data
      const parsedCoins = coinListFromSDK(coins)

      // Prime individual coin data for each mint
      if (parsedCoins) {
        parsedCoins.forEach((coin) => {
          if (coin.mint) {
            queryClient.setQueryData(getArtistCoinQueryKey(coin.mint), coin)
          }
        })
      }

      return parsedCoins
    },
    ...options,
    enabled: options?.enabled !== false
  })
}

// Export enum types for use in other components
export { GetCoinsSortMethodEnum, GetCoinsSortDirectionEnum }
