import { FixedDecimal } from '@audius/fixed-decimal'
import { PublicKey } from '@solana/web3.js'
import {
  queryOptions,
  useQuery,
  type QueryFunctionContext
} from '@tanstack/react-query'

import {
  useQueryContext,
  type QueryContextType
} from '~/api/tan-query/utils/QueryContext'
import { Feature } from '~/models/ErrorReporting'
import { toErrorWithMessage } from '~/utils/error'

import { QUERY_KEYS } from '../queryKeys'

type UseWalletSolBalanceParams = {
  /** Solana wallet address */
  walletAddress: string
}

const SOL_DECIMALS = 9 // SOL has 9 decimal places

const getWalletSolBalanceQueryKey = ({
  walletAddress
}: UseWalletSolBalanceParams) =>
  [QUERY_KEYS.walletSolBalance, walletAddress] as const

type FetchWalletSolBalanceContext = Pick<
  QueryContextType,
  'audiusSdk' | 'audiusBackend' | 'reportToSentry'
>

const getWalletSolBalanceQueryFn =
  (context: FetchWalletSolBalanceContext) =>
  async ({
    queryKey
  }: QueryFunctionContext<ReturnType<typeof getWalletSolBalanceQueryKey>>) => {
    const [_ignored, walletAddress] = queryKey
    const { audiusSdk, reportToSentry } = context

    try {
      const sdk = await audiusSdk()
      const connection = sdk.services.solanaClient.connection
      const walletSolBalance = await connection.getBalance(
        new PublicKey(walletAddress)
      )

      // Convert lamports to SOL with proper decimal formatting
      const walletSolBalanceFixedDecimal = new FixedDecimal(
        BigInt(walletSolBalance.toString()),
        SOL_DECIMALS
      )

      return {
        balanceUi: walletSolBalance.toLocaleString(),
        balanceLamports: walletSolBalanceFixedDecimal.value,
        balanceLocaleString: walletSolBalance.toLocaleString()
      }
    } catch (error) {
      reportToSentry({
        error: toErrorWithMessage(error),
        name: 'WalletSolBalanceFetchError',
        feature: Feature.TanQuery,
        additionalInfo: { walletAddress }
      })
      throw error
    }
  }

/**
 * Helper function to get the query options for fetching the SOL balance of a wallet.
 * Useful for getting the query key tagged with the data type stored in the cache.
 */
export const getWalletSolBalanceOptions = (
  context: FetchWalletSolBalanceContext,
  { walletAddress }: UseWalletSolBalanceParams
) => {
  return queryOptions({
    queryKey: getWalletSolBalanceQueryKey({
      walletAddress
    }),
    queryFn: getWalletSolBalanceQueryFn(context)
  })
}

/**
 * Hook for getting the SOL balance of a Solana wallet address.
 *
 * @param params.address - The Solana wallet address to check
 * @param options - Additional query options
 * @returns Object with status, data, and utility functions
 */
export const useWalletSolBalance = (
  params: UseWalletSolBalanceParams,
  options?: Partial<ReturnType<typeof getWalletSolBalanceOptions>>
) => {
  const context = useQueryContext()
  return useQuery({
    ...options,
    ...getWalletSolBalanceOptions(context, params)
  })
}
