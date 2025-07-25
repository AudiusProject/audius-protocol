import { useCallback } from 'react'

import { FixedDecimal } from '@audius/fixed-decimal'
import { encodeHashId } from '@audius/sdk'
import { PublicKey } from '@solana/web3.js'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentAccountUser } from '~/api'
import { useQueryContext } from '~/api/tan-query/utils'
import { Status } from '~/models/Status'
import { isNullOrUndefined } from '~/utils'

import { useArtistCoin } from '../coins/useArtistCoin'
import { QUERY_KEYS } from '../queryKeys'
import { QueryOptions, type QueryKey } from '../types'

export const getTokenBalanceQueryKey = (
  ethAddress: string | null,
  mint: string
) =>
  [
    QUERY_KEYS.tokenBalance,
    ethAddress,
    mint
  ] as unknown as QueryKey<FixedDecimal | null>

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
  const { audiusSdk } = useQueryContext()
  const { data: user } = useCurrentAccountUser()
  const ethAddress = user?.wallet ?? null
  const queryClient = useQueryClient()

  // Get coin metadata for decimals
  const { data: coin } = useArtistCoin({ mint })

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

        const encodedUserId = encodeHashId(user.user_id)
        if (!encodedUserId) {
          console.warn('Failed to encode user ID')
          return null
        }

        const response = await sdk.users.getUserCoin({
          id: encodedUserId,
          mint
        })

        // TODO: [PE-6571] Update to use totalBalance once it's available in the API
        const balance = response?.data?.accounts[0]?.balance

        if (isNullOrUndefined(balance) || !coin?.tokenInfo?.decimals) {
          return null
        }

        // Return FixedDecimal with proper decimals from coin metadata
        return {
          balance: new FixedDecimal(
            BigInt(balance.toString()),
            coin.tokenInfo.decimals
          ),
          decimals: coin.tokenInfo.decimals
        }
      } catch (e) {
        console.error(`Error fetching balance for mint ${mint}:`, e)
        // Return null instead of throwing to prevent infinite loading
        return null
      }
    },
    enabled:
      !!ethAddress && !!mint && !!user?.user_id && !!coin?.tokenInfo?.decimals,
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
      queryKey: getTokenBalanceQueryKey(ethAddress, mint)
    })
  }, [queryClient, ethAddress, mint])

  return {
    status,
    data,
    error: result.error,
    refresh: result.refetch,
    cancelPolling
  }
}
