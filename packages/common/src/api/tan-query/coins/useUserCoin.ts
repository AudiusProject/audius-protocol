import { encodeHashId, UserCoinWithAccounts } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useCurrentAccountUser } from '~/api'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useQueryContext } from '../utils'

export interface UseUserCoinParams {
  mint: string
}

export const getUserCoinQueryKey = (
  userId: ID | null | undefined,
  mint: string
) =>
  [
    QUERY_KEYS.userCoin,
    userId,
    mint
  ] as unknown as QueryKey<UserCoinWithAccounts | null>

export const useUserCoin = <TResult = UserCoinWithAccounts | null>(
  params: UseUserCoinParams,
  options?: SelectableQueryOptions<UserCoinWithAccounts | null, TResult>
) => {
  const { audiusSdk, env } = useQueryContext()
  const { data: user } = useCurrentAccountUser()

  return useQuery({
    queryKey: getUserCoinQueryKey(user?.user_id, params.mint),
    queryFn: async () => {
      const sdk = await audiusSdk()
      if (!user?.user_id) {
        return null
      }

      const encodedUserId = encodeHashId(user.user_id)
      if (!encodedUserId) {
        console.warn('Failed to encode user ID')
        return null
      }

      const response = await sdk.users.getUserCoin({
        id: encodedUserId,
        mint: params.mint
      })

      return response.data ?? null
    },
    enabled:
      options?.enabled !== false &&
      !!params.mint &&
      !!user?.user_id &&
      params.mint !== env.USDC_MINT_ADDRESS,
    ...options
  })
}
