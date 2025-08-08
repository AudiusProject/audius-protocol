import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useQueryContext } from '../utils/QueryContext'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

export type UseArtistCoinMembersCountArgs = Record<string, never>

export const getArtistCoinMembersCountQueryKey = (
  currentUserId?: number | null
) =>
  [
    QUERY_KEYS.artistCoinMembersCount,
    currentUserId
  ] as unknown as QueryKey<number>

export const useArtistCoinMembersCount = (
  _args: UseArtistCoinMembersCountArgs = {},
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: getArtistCoinMembersCountQueryKey(currentUserId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      if (!currentUserId) return 0

      // First, get the current user's artist coin
      const coinsResponse = await sdk.coins.getCoins({
        ownerId: [Id.parse(currentUserId)].filter(removeNullable),
        limit: 1
      })

      const userCoin = coinsResponse?.data?.[0]
      if (!userCoin?.mint) return 0

      // Get the coin insights which includes the holder count
      const insightsResponse = await sdk.coins.getCoinInsights({
        mint: userCoin.mint
      })

      // Return the holder count from the insights
      return insightsResponse?.data?.holder || 0
    },
    ...options,
    enabled: options?.enabled !== false && !!currentUserId
  })
}
