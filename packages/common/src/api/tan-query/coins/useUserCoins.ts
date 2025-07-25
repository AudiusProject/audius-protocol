import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS } from '../queryKeys'
import { useQueryContext } from '../utils'

export interface UserCoin {
  mint: string
  ticker: string
  balance: number
  balanceUsd: number
}

export interface UseUserCoinsParams {
  userId: string
  limit?: number
  offset?: number
}

export const useUserCoins = (params: UseUserCoinsParams) => {
  const { audiusSdk } = useQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.userCoins, params],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const response = await sdk.users.getUserCoins({
        id: params.userId,
        limit: params.limit,
        offset: params.offset
      })
      return response.data as UserCoin[]
    },
    enabled: !!params.userId
  })
}
