import { useQuery } from '@tanstack/react-query'

import { useCurrentUserId } from '~/api/tan-query/users/account/useCurrentUserId'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'

type UserCoinBalanceResponse = {
  data: Array<{
    owner: string
    account: string
    balance: number
  }>
}

export const getUserCoinBalanceQueryKey = (
  userId: ID | null | undefined,
  mint: string | null | undefined
) =>
  [
    QUERY_KEYS.userCoinBalance,
    userId,
    mint
  ] as unknown as QueryKey<UserCoinBalanceResponse | null>

type UseUserCoinBalanceParams = {
  userId: ID | null | undefined
  mint: string
}

/**
 * Hook to get a user's balance for a specific coin mint address.
 * Currently mocked since the SDK method is not yet implemented.
 * For the current user, always returns a balance.
 * For other users, returns a balance 50% of the time.
 */
export const useUserCoinBalance = <TResult = UserCoinBalanceResponse | null>(
  { userId, mint }: UseUserCoinBalanceParams,
  options?: SelectableQueryOptions<UserCoinBalanceResponse | null, TResult>
) => {
  const { data: currentUserId } = useCurrentUserId()
  const validUserId = !!userId && userId > 0
  const validMint = !!mint

  return useQuery({
    queryKey: getUserCoinBalanceQueryKey(userId, mint),
    queryFn: async (): Promise<UserCoinBalanceResponse | null> => {
      const isCurrentUser = userId === currentUserId

      // For current user, always return a balance
      if (isCurrentUser) {
        return {
          data: [
            {
              owner: 'CTyFguG69kwYrzk24P3UuBvY1rR5atu9kf2S6XEwAU8X',
              account: 'HzZ3EKACbH6XEHs59Rt1adVzUKv5cTDE9o9YWFaMhwpF',
              balance: 1000000000
            }
          ]
        }
      }

      // For other users, return balance 50% of the time
      const shouldHaveBalance = Math.random() < 0.5

      if (shouldHaveBalance) {
        return {
          data: [
            {
              owner: 'CTyFguG69kwYrzk24P3UuBvY1rR5atu9kf2S6XEwAU8X',
              account: 'HzZ3EKACbH6XEHs59Rt1adVzUKv5cTDE9o9YWFaMhwpF',
              balance: Math.floor(Math.random() * 500000000) + 100000000 // Random balance between 100M and 600M
            }
          ]
        }
      }

      // Return null for no balance
      return null
    },
    ...options,
    enabled: options?.enabled !== false && validUserId && validMint,
    // Cache for 5 minutes since balances can change
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10
  })
}
