import { Commitment } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'

import { useQueryContext } from '~/api'
import { Status } from '~/models/Status'
import { BNUSDC, StringUSDC } from '~/models/Wallet'
import { getUserbankAccountInfo } from '~/services/index'
import { getRecoveryStatus } from '~/store/buy-usdc/selectors'
import { setUSDCBalance } from '~/store/wallet/slice'

import { useGetCurrentUser } from '../../index'
import { QUERY_KEYS } from '../queryKeys'
import { QueryOptions, type QueryKey } from '../types'

export const getUSDCBalanceQueryKey = (
  ethAddress: string | null,
  commitment: Commitment
) =>
  [
    QUERY_KEYS.usdcBalance,
    ethAddress,
    commitment
  ] as unknown as QueryKey<BNUSDC | null>

/**
 * Hook to get the USDC balance for the current user.
 * Uses TanStack Query for data fetching and caching.
 *
 * @param options Options for the query and polling
 * @returns Object with status, data, refresh, and cancelPolling
 */
export const useUSDCBalance = ({
  isPolling,
  pollingInterval = 1000,
  commitment = 'processed',
  ...queryOptions
}: {
  isPolling?: boolean
  pollingInterval?: number
  commitment?: Commitment
} & QueryOptions = {}) => {
  const { audiusSdk } = useQueryContext()
  const { data: user } = useGetCurrentUser({})
  const ethAddress = user?.wallet ?? null
  const dispatch = useDispatch()
  const recoveryStatus = useSelector(getRecoveryStatus)

  const result = useQuery({
    queryKey: getUSDCBalanceQueryKey(ethAddress, commitment),
    queryFn: async () => {
      const sdk = await audiusSdk()
      if (!ethAddress) {
        return null
      }

      try {
        const account = await getUserbankAccountInfo(
          sdk,
          {
            ethAddress,
            mint: 'USDC'
          },
          commitment
        )
        const balance = (account?.amount ?? new BN(0)) as BNUSDC

        // Still update Redux for compatibility with existing code
        dispatch(setUSDCBalance({ amount: balance.toString() as StringUSDC }))

        return balance
      } catch (e) {
        console.error('Error fetching USDC balance:', e)
        throw e
      }
    },
    enabled: !!ethAddress,
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

  // If we're actively recovering, then we will be in loading state regardless
  if (recoveryStatus === Status.LOADING) {
    status = Status.LOADING
  }

  return {
    status,
    data,
    refresh: result.refetch
  }
}
