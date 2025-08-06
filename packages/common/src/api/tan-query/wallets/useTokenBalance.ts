import { useCallback } from 'react'

import { FixedDecimal } from '@audius/fixed-decimal'
import { PublicKey } from '@solana/web3.js'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentAccountUser } from '~/api'
import { useQueryContext } from '~/api/tan-query/utils'
import { Status } from '~/models/Status'
import { isNullOrUndefined } from '~/utils'
import { isResponseError } from '~/utils/error'

import { useUserCoin } from '../coins/useUserCoin'
import { QUERY_KEYS } from '../queryKeys'
import { QueryOptions, type QueryKey } from '../types'

import { useUSDCBalance } from './useUSDCBalance'

/**
 * Checks if the error is a 404 ResponseError from the balance endpoint
 * which indicates the user has no balance for the token (not a real error)
 */
const isNoBalanceError = (error: unknown): boolean => {
  return isResponseError(error) && error.response.status === 404
}

export type TokenBalanceQueryData = {
  balance: FixedDecimal
  decimals: number
  isEmpty?: boolean
} | null

export const getTokenBalanceQueryKey = (
  ethAddress: string | null,
  mint: string
) =>
  [
    QUERY_KEYS.tokenBalance,
    ethAddress,
    mint
  ] as unknown as QueryKey<TokenBalanceQueryData>

/**
 * Hook to get the balance for any supported token for the current user.
 * Uses TanStack Query for data fetching and caching.
 *
 * @param mint The mint address of the token to fetch balance for
 * @param options Options for the query and polling
 * @returns Object with status, data, refresh, and cancelPolling
 */
export const useTokenBalance = ({
  mint,
  isPolling,
  pollingInterval = 1000,
  ...queryOptions
}: {
  mint: string
  isPolling?: boolean
  pollingInterval?: number
} & QueryOptions) => {
  const { audiusSdk, env } = useQueryContext()
  const { data: user } = useCurrentAccountUser()
  const ethAddress = user?.wallet ?? null
  const queryClient = useQueryClient()
  const isUsdc = mint === env.USDC_MINT_ADDRESS
  const { data: userCoin } = useUserCoin({ mint })

  // Use specialized USDC hook when dealing with USDC
  const usdcResult = useUSDCBalance({
    isPolling,
    pollingInterval,
    enabled: isUsdc && !!ethAddress,
    ...queryOptions
  })

  const result = useQuery({
    queryKey: getTokenBalanceQueryKey(ethAddress, mint),
    queryFn: async () => {
      const sdk = await audiusSdk()
      if (!ethAddress || !mint || !user?.user_id) {
        return null
      }

      try {
        // Ensure userbank exists before fetching balance
        await sdk.services.claimableTokensClient.getOrCreateUserBank({
          ethWallet: ethAddress,
          mint: new PublicKey(mint)
        })

        const balance = userCoin?.balance

        if (isNullOrUndefined(balance)) {
          return null
        }

        // Ensure we have valid decimals from coin metadata
        const decimals = userCoin?.decimals
        if (isNullOrUndefined(decimals)) {
          console.warn(`Missing decimals for token ${mint}`)
          return null
        }

        // Return FixedDecimal with proper decimals from coin metadata
        return {
          balance: new FixedDecimal(BigInt(balance.toString()), decimals),
          decimals
        }
      } catch (e) {
        // Handle specific 404 "no rows in result set" case
        // This typically means the user has no balance for this token
        if (isNoBalanceError(e)) {
          const decimals = userCoin?.decimals
          if (isNullOrUndefined(decimals)) {
            console.warn(`Missing decimals for token ${mint} in error handling`)
            return null
          }

          return {
            balance: new FixedDecimal(BigInt(0), decimals),
            decimals,
            isEmpty: true
          }
        }

        console.error(`Error fetching balance for mint ${mint}:`, e)
        // Return null for other errors to prevent infinite loading
        return null
      }
    },
    enabled:
      !isUsdc &&
      !!ethAddress &&
      !!mint &&
      !!user?.user_id &&
      !!userCoin?.decimals,
    // TanStack Query's built-in polling - only poll when isPolling is true
    refetchInterval: isPolling ? pollingInterval : false,
    // Prevent refetching when window regains focus during polling to avoid conflicts
    refetchOnWindowFocus: !isPolling,
    ...queryOptions
  })

  // Function to cancel polling by invalidating and refetching the query
  // This effectively stops the current polling cycle
  const cancelPolling = useCallback(() => {
    if (isUsdc) {
      return usdcResult.cancelPolling()
    }
    queryClient.cancelQueries({
      queryKey: getTokenBalanceQueryKey(ethAddress, mint)
    })
  }, [isUsdc, usdcResult, queryClient, ethAddress, mint])

  // If this is USDC, return data from the USDC hook with proper formatting
  if (isUsdc) {
    const usdcData = usdcResult.data
    const formattedData = usdcData
      ? {
          balance: new FixedDecimal(usdcData, 6), // USDC has 6 decimals
          decimals: 6
        }
      : null

    return {
      status: usdcResult.status,
      data: formattedData,
      error: usdcResult.error,
      refresh: usdcResult.refresh,
      cancelPolling
    }
  }

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
  return {
    status,
    data,
    error: result.error,
    refresh: result.refetch,
    cancelPolling
  }
}
