import { useCallback } from 'react'

import { FixedDecimal } from '@audius/fixed-decimal'
import { TokenAccountNotFoundError } from '@solana/spl-token'
import { Commitment } from '@solana/web3.js'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUserId, useUser } from '~/api'
import { useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models'
import { Status } from '~/models/Status'
import { MintName } from '~/services/audius-backend/solana'
import { getUserbankAccountInfo, getTokenBySymbol } from '~/services/index'

import { QUERY_KEYS } from '../queryKeys'
import { QueryOptions, type QueryKey } from '../types'

const createTokenBalance = (
  amount: string | number | bigint | null | undefined,
  decimals: number
): FixedDecimal | null => {
  if (amount === null || amount === undefined) {
    return null
  }
  return new FixedDecimal(BigInt(amount.toString()), decimals)
}

export const getTokenBalanceQueryKey = (
  ethAddress: string | null,
  token: MintName,
  commitment: Commitment
) =>
  [
    QUERY_KEYS.tokenBalance,
    ethAddress,
    token,
    commitment
  ] as unknown as QueryKey<FixedDecimal | null>

/**
 * Hook to get the balance for any supported token for the current user.
 * Uses TanStack Query for data fetching and caching.
 *
 * @param token The token to fetch balance for
 * @param options Options for the query and polling
 * @returns Object with status, data, refresh, and cancelPolling
 */
export const useTokenBalance = ({
  token,
  userId,
  isPolling,
  pollingInterval = 1000,
  commitment = 'processed',
  ...queryOptions
}: {
  token: MintName
  userId?: ID
  isPolling?: boolean
  pollingInterval?: number
  commitment?: Commitment
} & QueryOptions) => {
  const { audiusSdk, env } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const { data: user } = useUser(userId ?? currentUserId)
  const isCurrentUser = !userId || userId === currentUserId
  const ethAddress = user?.wallet ?? null
  const queryClient = useQueryClient()

  const result = useQuery({
    queryKey: getTokenBalanceQueryKey(ethAddress, token, commitment),
    queryFn: async () => {
      const sdk = await audiusSdk()
      if (!ethAddress || !token) {
        return null
      }

      try {
        const account = await getUserbankAccountInfo(
          sdk,
          {
            ethAddress,
            mint: token
          },
          commitment
        )

        // Get token configuration from registry to get decimal places
        const tokenConfig = getTokenBySymbol(env, token)
        if (!tokenConfig) {
          console.warn(
            `Token not found in registry: ${token}, returning null balance`
          )
          return null
        }

        return createTokenBalance(account?.amount, tokenConfig.decimals)
      } catch (e) {
        // If user doesn't have a token account yet, return 0 balance
        if (e instanceof TokenAccountNotFoundError) {
          const tokenConfig = getTokenBySymbol(env, token)
          if (!tokenConfig) {
            console.warn(
              `Token not found in registry: ${token}, returning null balance`
            )
            return null
          }
          // TODO: temporarily fake balances for testing
          if (isCurrentUser) {
            return createTokenBalance(100000000, tokenConfig.decimals)
          }
          return createTokenBalance(
            Math.floor(Math.random() * 500000000) + 100000000,
            tokenConfig.decimals
          )
        }
        console.error(`Error fetching ${token} balance:`, e)
        return null
      }
    },
    enabled: !!ethAddress && !!token,
    // TanStack Query's built-in polling - only poll when isPolling is true
    refetchInterval: isPolling ? pollingInterval : false,
    // Prevent refetching when window regains focus during polling to avoid conflicts
    refetchOnWindowFocus: !isPolling,
    ...queryOptions
  })

  // Map TanStack Query states to the Status enum for API compatibility
  let status = Status.IDLE
  if (result.isPending) {
    status = Status.LOADING
  } else if (result.isError) {
    status = Status.ERROR
  } else if (result.isSuccess) {
    status = Status.SUCCESS
  }

  // For compatibility with existing code
  const data = result.data ?? null

  // Function to cancel polling by invalidating and refetching the query
  // This effectively stops the current polling cycle
  const cancelPolling = useCallback(() => {
    queryClient.cancelQueries({
      queryKey: getTokenBalanceQueryKey(ethAddress, token, commitment)
    })
  }, [queryClient, ethAddress, token, commitment])

  return {
    status,
    data,
    error: result.error,
    refresh: result.refetch,
    cancelPolling
  }
}
