import { useCallback } from 'react'

import { TRUMP, USDC, wAUDIO } from '@audius/fixed-decimal'
import { TokenAccountNotFoundError } from '@solana/spl-token'
import { Commitment } from '@solana/web3.js'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentAccountUser } from '~/api'
import { useQueryContext } from '~/api/tan-query/utils'
import { Status } from '~/models/Status'
import { MintName } from '~/services/audius-backend/solana'
import { getUserbankAccountInfo } from '~/services/index'

import { QueryOptions } from '../types'

// Map token symbols to their Fixed Decimal constructors
const TOKEN_CONSTRUCTORS = {
  wAUDIO,
  USDC,
  TRUMP
} as const

type TokenSymbol = keyof typeof TOKEN_CONSTRUCTORS

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
  isPolling,
  pollingInterval = 1000,
  commitment = 'processed',
  ...queryOptions
}: {
  token: MintName
  isPolling?: boolean
  pollingInterval?: number
  commitment?: Commitment
} & QueryOptions) => {
  const { audiusSdk } = useQueryContext()
  const { data: user } = useCurrentAccountUser()
  const ethAddress = user?.wallet ?? null
  const queryClient = useQueryClient()

  const result = useQuery({
    queryKey: ['tokenBalance', ethAddress, token, commitment],
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

        const TokenConstructor = TOKEN_CONSTRUCTORS[token as TokenSymbol]
        if (!TokenConstructor) {
          console.warn(`Unsupported token: ${token}, returning null balance`)
          return null
        }

        const balance =
          account?.amount !== undefined && account?.amount !== null
            ? TokenConstructor(BigInt(account.amount.toString()))
            : TokenConstructor(BigInt(0))

        return balance
      } catch (e) {
        // If user doesn't have a token account yet, return 0 balance
        if (e instanceof TokenAccountNotFoundError) {
          const TokenConstructor = TOKEN_CONSTRUCTORS[token as TokenSymbol]
          if (!TokenConstructor) {
            console.warn(`Unsupported token: ${token}, returning null balance`)
            return null
          }
          return TokenConstructor(BigInt(0))
        }
        console.error(`Error fetching ${token} balance:`, e)
        // Return null instead of throwing to prevent infinite loading
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
      queryKey: ['tokenBalance', ethAddress, token, commitment]
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
