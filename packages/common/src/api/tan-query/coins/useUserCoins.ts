import { useMemo } from 'react'

import { HashId, Id, UserCoin } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { SelectableQueryOptions } from '../types'
import { useQueryContext } from '../utils'

export interface UseUserCoinsParams {
  userId: ID | undefined | null
  limit?: number
  offset?: number
}

export type UserCoinParsed = Omit<UserCoin, 'ownerId'> & {
  ownerId: ID
}

export const useUserCoins = <TResult = UserCoinParsed[]>(
  params: UseUserCoinsParams,
  options?: SelectableQueryOptions<UserCoinParsed[], TResult>
) => {
  const { audiusSdk } = useQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.userCoins, params],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const response = await sdk.users.getUserCoins({
        id: Id.parse(params.userId),
        limit: params.limit,
        offset: params.offset
      })
      if (response.data) {
        return response.data.map((coinFromSDK) => ({
          ...coinFromSDK,
          ownerId: HashId.parse(coinFromSDK.ownerId)
        })) as UserCoinParsed[]
      }
      return []
    },
    ...options,
    enabled: !!params.userId && options?.enabled !== false
  })
}

// Wrapper hook for above hook but adds a selector that filters results down to only the coin the user owns
export const useUserOwnedCoin = (userId: ID | null) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const select = useMemo(
    () => (data: UserCoinParsed[]) => {
      return data.find((coin) => {
        return coin.ownerId === userId
      })
    },
    [userId]
  )

  return useUserCoins(
    { userId },
    {
      select
    }
  )
}
